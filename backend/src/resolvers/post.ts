import {
    Arg,
    Ctx,
    Field,
    FieldResolver,
    InputType,
    Int,
    Mutation,
    Query,
    Resolver,
    Root,
    UseMiddleware,
} from 'type-graphql'
import { getConnection } from 'typeorm'
import { Post } from '../entities/Post'
import { isAuth } from './../middleware/isAuth'
import { MyContext } from '../types'

@InputType()
class PostInput {
    @Field()
    title: string
    @Field()
    text: string
}

@Resolver(Post)
export class PostResolver {
    @FieldResolver(() => String)
    textSnippet(@Root() root: Post) {
        return root.text.slice(0, 65) + '...'
    }

    @Query(() => [Post])
    async posts(
        @Arg('limit', () => Int) limit: number,
        @Arg('cursor', () => String, { nullable: true }) cursor?: string
    ) {
        const realLimit = Math.min(50, limit)

        const posts = await getConnection().query(
            `
        select p.*,
        json_build_object(
            'id', u.id,
            'username', u.username,
            'email', u.email,
            'createdAt', u."createdAt",
            'updatedAt', u."updatedAt"
        ) creator
        from post p
        inner join public.user u on u.id = p."creatorId"
        ${cursor ? `where p."createdAt" < ${new Date(parseInt(cursor))}` : ''}
        order by p."createdAt" DESC
        limit ${realLimit}
        `
        )

        return posts
    }

    @Query(() => Post, { nullable: true })
    post(@Arg('id') id: number) {
        return Post.findOne(id)
    }

    @UseMiddleware(isAuth)
    @Mutation(() => Post)
    async createPost(
        @Arg('input') input: PostInput,
        @Ctx() { req }: MyContext
    ) {
        return Post.create({ ...input, creatorId: req.session.userId }).save()
    }

    @Mutation(() => Post, { nullable: true })
    async updatePost(@Arg('id') id: number, @Arg('title') title?: string) {
        const post = await Post.findOne(id)

        if (title && post) await Post.update({ id }, { title })

        return post
    }

    @Mutation(() => Boolean)
    async deletePost(@Arg('id') id: number) {
        await Post.delete(id)
        return true
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async vote(
        @Arg('postId') postId: number,
        @Arg('value') value: number,
        @Ctx() { req }: MyContext
    ) {
        if (Number.isNaN(value) || value === 0) return false

        const { userId } = req.session
        const updoot = value > 0 ? 1 : -1

        // await Updoot.insert({ userId, postId, value: updoot })

        await getConnection().query(`
        start transaction;

        insert into updoot ("userId", "postId", "value")
        values (${userId}, ${postId}, ${updoot});

        update post
        set points = points + ${updoot}
        where id = ${postId};

        commit;
        `)

        return true
    }
}
