import argo2 from 'argon2'
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
import { COOKIE_NAME } from '../constants'
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
        @Ctx() { em }: MyContext
    ) {
        const user = await em.findOne(User, { email: email })
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

        const hashedPassword = await argo2.hash(password)

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
        const valid = await argo2.verify(user.password, password)
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
