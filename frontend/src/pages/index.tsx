import {
    Box,
    Button,
    Flex,
    Heading,
    Spinner,
    Stack,
    Text,
} from '@chakra-ui/core'
import NextLink from 'next/link'
import { withUrqlClient } from 'next-urql'
import { Layout } from '../components/Layout'
import { usePostsQuery } from '../generated/graphql'
import { createUrqlClient } from '../utils/createUrqlClient'
import React, { useState } from 'react'
import AlertUI from '../components/Alert'

const Index = () => {
    const [vars, setVars] = useState({
        limit: 15,
        cursor: null as string | null,
    })
    const [{ data, fetching }] = usePostsQuery({
        variables: vars,
    })

    let body = null
    if (!fetching && !data) {
        body = <AlertUI message="No Posts or Failed loading them" />
    } else {
        body =
            !data && fetching ? (
                <Flex m="auto">
                    <Spinner
                        m="auto"
                        size="xl"
                        color="teal.500"
                        emptyColor="gray.200"
                    />
                </Flex>
            ) : (
                <>
                    <Stack spacing={8}>
                        {data?.posts.map(
                            ({ id, title, textSnippet, creator }) => (
                                <Box
                                    key={id}
                                    p={5}
                                    shadow="md"
                                    borderWidth="1px"
                                >
                                    <Heading fontSize="xl">{title}</Heading>
                                    <Text color="blue.400">
                                        posted by {creator.username}
                                    </Text>
                                    <Text mt={4}>{textSnippet}</Text>
                                </Box>
                            )
                        )}
                    </Stack>
                    {data && (
                        <Flex>
                            <Button
                                isLoading={fetching}
                                my={4}
                                mx="auto"
                                px={8}
                                py={5}
                                onClick={() => {
                                    setVars({
                                        limit: vars.limit,
                                        cursor:
                                            data.posts[data.posts.length - 1]
                                                .createdAt,
                                    })
                                }}
                            >
                                Load More
                            </Button>
                        </Flex>
                    )}
                </>
            )
    }

    return (
        <Layout>
            <NextLink href="/create-post">
                <Button variantColor="teal" mb={4}>
                    Create Post
                </Button>
            </NextLink>
            {body}
        </Layout>
    )
}

export default withUrqlClient(createUrqlClient, { ssr: true })(Index)
