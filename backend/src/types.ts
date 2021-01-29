import { EntityManager } from '@mikro-orm/core'
import { Request, Response } from 'express'
import { Session } from 'express-session'

export type MyContext = {
    em: EntityManager<any> & EntityManager
    req: Request & { session: Session & { userId: number } }
    res: Response
}
