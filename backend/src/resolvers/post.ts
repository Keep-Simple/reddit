import { isAuth } from './../middleware/isAuth'
import { MyContext } from 'src/types'
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
import { Post } from '../entities/Post'
import { getConnection } from 'typeorm'

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
    posts(
        @Arg('limit', () => Int) limit: number,
        @Arg('cursor', () => String, { nullable: true }) cursor?: string
    ) {
        const realLimit = Math.min(50, limit)

        const query = getConnection()
            .getRepository(Post)
            .createQueryBuilder('p')
            .orderBy('"createdAt"', 'DESC')
            .take(realLimit)

        if (cursor) {
            query.where('"createdAt" < :cursor', {
                cursor: new Date(parseInt(cursor)),
            })
        }

        return query.getMany()
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
}
