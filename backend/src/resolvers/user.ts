import argoHash from 'argon2'
import {
    Arg,
    Ctx,
    Field,
    InputType,
    Mutation,
    ObjectType,
    Query,
    Resolver,
} from 'type-graphql'
import { v4 } from 'uuid'

import { sendEmail } from '../utils/sendEmail'
import { COOKIE_NAME, FORGET_PASSWORD_PPREFIX } from '../constants'
import { validateRegistration } from '../utils/validateRegister'
import { User } from '../entities/User'
import { MyContext } from '../types'

@InputType()
export class AuthInput {
    @Field()
    username: string
    @Field()
    password: string
    @Field()
    email: string
}

@ObjectType()
class FieldError {
    @Field()
    field: string
    @Field()
    message: string
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[]
    @Field(() => User, { nullable: true })
    user?: User
}

@Resolver()
export class UserResolver {
    @Query(() => User, { nullable: true })
    me(@Ctx() { req, em }: MyContext) {
        if (!req.session.userId) {
            return null
        }
        return em.findOne(User, { id: req.session.userId })
    }

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() { em, redis }: MyContext
    ) {
        const user = await em.findOne(User, { email: email })

        if (!user) {
            // to prevent fishing
            return true
        }

        const token = v4()

        await redis.set(
            FORGET_PASSWORD_PPREFIX + token,
            user.id,
            'ex',
            1000 * 3600 * 72 // 3 days
        )

        const host = 'http://localhost:3000'

        await sendEmail(
            email,
            `<a href="${host}/change-password/${token}">reset password</a>`
        )

        return true
    }

    @Mutation(() => UserResponse)
    async changePassword(
        @Arg('token') token: string,
        @Arg('newPassword') newPassword: string,
        @Ctx() { redis, em, req }: MyContext
    ): Promise<UserResponse> {
        if (newPassword.length <= 2) {
            return {
                errors: [
                    {
                        field: 'newPassword',
                        message: 'length must be greater than 2',
                    },
                ],
            }
        }

        const userId = await redis.get(FORGET_PASSWORD_PPREFIX + token)

        const tokenError = [
            {
                field: 'tokenError',
                message: 'token expired or user not found',
            },
        ]

        if (!userId) return { errors: tokenError }

        const user = await em.findOne(User, { id: parseInt(userId) })

        if (!user) return { errors: tokenError }

        user.password = await argoHash.hash(newPassword)

        await em.persistAndFlush(user)

        req.session.userId = user.id

        return { user }
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: AuthInput,
        @Ctx() { em, req }: MyContext
    ) {
        const errors = validateRegistration(options)

        const { username, password, email } = options

        if (errors.length > 0) return { errors }

        if (await em.findOne(User, { username })) {
            return { errors: [{ field: 'username', message: 'already taken' }] }
        }
        // Create User and return

        const hashedPassword = await argoHash.hash(password)

        const user = em.create(User, {
            username,
            password: hashedPassword,
            email,
        })

        await em.persistAndFlush(user)

        req.session.userId = user.id
        return { user }
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('usernameOrEmail') usernameOrEmail: string,
        @Arg('password') password: string,
        @Ctx() { em, req }: MyContext
    ) {
        const isEmail = usernameOrEmail.includes('@')
        const user = await em.findOne(
            User,
            isEmail ? { email: usernameOrEmail } : { username: usernameOrEmail }
        )

        if (!user) {
            return {
                errors: [
                    {
                        field: 'usernameOrEmail',
                        message: "that user doesn't exist",
                    },
                ],
            }
        }
        const valid = await argoHash.verify(user.password, password)
        if (!valid) {
            return {
                errors: [
                    {
                        field: 'password',
                        message: 'incorrect password',
                    },
                ],
            }
        }

        req.session.userId = user.id

        return { user }
    }

    @Mutation(() => Boolean)
    logout(@Ctx() { req, res }: MyContext) {
        res.clearCookie(COOKIE_NAME)

        return new Promise((resolve) =>
            req.session.destroy((e) => (e ? resolve(false) : resolve(true)))
        )
    }
}
