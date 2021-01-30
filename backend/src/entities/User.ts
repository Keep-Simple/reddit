import { Entity, PrimaryKey, Property } from '@mikro-orm/core'
import { Field, ObjectType } from 'type-graphql'

@ObjectType()
@Entity()
export class User {
    @Field()
    @PrimaryKey()
    id!: number

    @Field(() => String)
    @Property({ type: 'date' })
    createdAt = new Date()

    @Field(() => String)
    @Property({ onUpdate: () => new Date(), type: 'date' })
    updatedAt = new Date()

    @Field()
    @Property({ type: 'text', unique: true })
    username!: string

    @Field()
    @Property({ type: 'text', unique: true })
    email!: string

    @Property({ type: 'text' })
    password!: string
}
