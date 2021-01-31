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
import { Updoot } from '../entities/Updoot'

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
        @Ctx()
        { req }: MyContext,
        @Arg('limit', () => Int) limit: number,
        @Arg('cursor', () => String, { nullable: true }) cursor?: string
    ) {
        const realLimit = Math.min(50, limit)
        const userId = req.session.userId

        const posts = await getConnection().query(
            `
        select p.*,
        json_build_object(
            'id', u.id,
            'username', u.username,
            'email', u.email,
            'createdAt', u."createdAt",
            'updatedAt', u."updatedAt"
        ) creator,
        ${
            userId
                ? `(select value from updoot where "userId" = ${userId} and "postId" = p.id) "voteStatus"`
                : 'null as "voteStatus"'
        }
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
        @Arg('postId', () => Int) postId: number,
        @Arg('value', () => Int) value: number,
        @Ctx()
        {
            req: {
                session: { userId },
            },
        }: MyContext
    ) {
        if (Number.isNaN(value) || value === 0) return false

        const updoot = await Updoot.findOne({ where: { postId, userId } })

        const updootValue = value > 0 ? 1 : -1

        // change vote
        if (updoot && updoot.value !== updootValue) {
            await getConnection().transaction(async (tm) => {
                await tm.query(
                    `
                    update updoot
                    set value = ${updootValue}
                    where "postId" = ${postId} and "userId" = ${userId};

                    update post
                    set points = points + ${updootValue * 2}
                    where id = ${postId};
                    `
                )
            })
            return true
            // create vote
        } else if (!updoot) {
            await getConnection().transaction(async (tm) => {
                await tm.query(`
                    insert into updoot ("userId", "postId", "value")
                    values (${userId}, ${postId}, ${updootValue});

                    update post
                    set points = points + ${updootValue}
                    where id = ${postId};
        `)
            })

            return true
        }

        return false
    }
}
