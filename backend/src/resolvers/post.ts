import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { Post } from '../entities/Post'
import { MyContext } from '../types'

@Resolver()
export class PostResolver {
    @Query(() => [Post])
    posts(@Ctx() { em }: MyContext) {
        return em.find(Post, {})
    }

    @Query(() => Post, { nullable: true })
    post(@Arg('id') id: number, @Ctx() { em }: MyContext) {
        return em.findOne(Post, { id })
    }

    @Mutation(() => Post)
    async createPost(@Arg('title') title: string, @Ctx() { em }: MyContext) {
        const post = em.create(Post, { title })
        await em.persistAndFlush(post)
        return post
    }

    @Mutation(() => Post, { nullable: true })
    async updatePost(
        @Arg('id') id: number,
        @Ctx() { em }: MyContext,
        @Arg('title') title?: string
    ) {
        const post = await em.findOne(Post, { id })

        if (title && post) {
            post.title = title
            await em.persistAndFlush(post)
        }

        return post
    }

    @Mutation(() => Boolean)
    async deletePost(@Arg('id') id: number, @Ctx() { em }: MyContext) {
        await em.nativeDelete(Post, { id })
        return true
    }
}
