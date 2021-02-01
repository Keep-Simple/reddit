import { Box, Button, Flex, Heading, Spinner } from '@chakra-ui/core'
import React from 'react'
import { useLogoutMutation, useMeQuery } from '../generated/graphql'
import { NextChakraLink } from './NextChakraLink'

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
                <NextChakraLink href="login" mr={2}>
                    Sign In
                </NextChakraLink>
                <NextChakraLink href="register" mr={2}>
                    Sign Up
                </NextChakraLink>
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
            bg="purple.200"
            justifyContent="center"
            position="sticky"
            zIndex={10}
        >
            <Flex flex={1} maxW={800} justifyContent="space-between">
                <NextChakraLink href="/">
                    <Heading>keep-music</Heading>
                </NextChakraLink>
                <Flex alignItems="center">{body}</Flex>
            </Flex>
        </Flex>
    )
}
