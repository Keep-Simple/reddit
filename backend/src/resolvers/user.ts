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
import { User } from '../entities/User'
import { MyContext } from '../types'

@InputType()
class UsernamePasswordInput {
    @Field()
    username: string
    @Field()
    password: string
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
        if (!req.session.userId) return null
        return em.findOne(User, { id: req.session.userId })
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg('options') { username, password }: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ) {
        // Validate
        const errors = []

        if (username.length <= 2) {
            errors.push({
                field: 'username',
                message: 'length must be greater than 2',
            })
        }
        if (password.length <= 3) {
            errors.push({
                field: 'password',
                message: 'length must be greater than 3',
            })
        }
        if (errors.length > 0) return { errors }

        if (await em.findOne(User, { username })) {
            return { errors: [{ field: 'username', message: 'already taken' }] }
        }
        // Create User and return

        const hashedPassword = await argo2.hash(password)

        const user = em.create(User, { username, password: hashedPassword })
        await em.persistAndFlush(user)

        req.session.userId = user.id
        return { user }
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ) {
        const user = await em.findOne(User, { username: options.username })
        if (!user) {
            return {
                errors: [
                    {
                        field: 'username',
                        message: "that username doesn't exist",
                    },
                ],
            }
        }
        const valid = await argo2.verify(user.password, options.password)
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
