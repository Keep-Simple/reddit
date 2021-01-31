import { Box, Button, Flex, Link, Spinner } from '@chakra-ui/core'
import NextLink from 'next/link'
import React from 'react'
import { useLogoutMutation, useMeQuery } from '../generated/graphql'

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
    const [{ data, fetching }] = useMeQuery()
    const [{ fetching: logoutFetching }, logout] = useLogoutMutation()

    let body

    if (fetching) {
        body = <Spinner />
    } else if (!data?.me) {
        body = (
            <>
                <NextLink href="login">
                    <Link mr={2}>Sign In</Link>
                </NextLink>
                <NextLink href="register">
                    <Link>Sign Up</Link>
                </NextLink>
            </>
        )
    } else {
        body = (
            <>
                <Box mr={2}>{data.me.username}</Box>
                <Button
                    onClick={() => logout()}
                    isLoading={logoutFetching}
                    variant="link"
                >
                    Logout
                </Button>
            </>
        )
    }
    return (
        <Flex
            p={4}
            bg="tan"
            justifyContent="flex-end"
            position="sticky"
            top={0}
            zIndex={10}
        >
            {body}
        </Flex>
    )
}
