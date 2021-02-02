import { Box, Button, Flex, Heading, Stack, Text } from '@chakra-ui/core'
import { withUrqlClient } from 'next-urql'
import { Layout } from '../components/Layout'
import { usePostsQuery } from '../generated/graphql'
import { createUrqlClient } from '../utils/createUrqlClient'
import React, { useState } from 'react'
import NextLink from 'next/link'
import AlertUI from '../components/Alert'
import { Loading } from '../components/Loading'
import { NextChakraLink } from '../components/NextChakraLink'
import { EditDeletePostButtons } from '../components/EditDeletePostButtons'
import { UpdootSection } from '../components/UpdootSection'

const Index = () => {
    const [vars, setVars] = useState({
        limit: 15,
        cursor: null as string | null,
    })

    const [{ data, error, fetching }] = usePostsQuery({
        variables: vars,
    })

    if (error) {
        console.log(error)
    }

    let body = null
    if (!fetching && !data) {
        body = <AlertUI message="No Posts or Failed loading them" />
    } else {
        body =
            !data && fetching ? (
                <Loading />
            ) : (
                <>
                    <Stack spacing={8}>
                        {data?.posts
                            .filter((p) => p !== null) // cache invalidation will leave null
                            .map((p) => {
                                const { id, title, textSnippet, creator } = p
                                return (
                                    <Flex
                                        key={id}
                                        p={5}
                                        shadow="md"
                                        borderWidth="1px"
                                    >
                                        <UpdootSection post={p} />
                                        <Box w="100%">
                                            <NextChakraLink
                                                href={`/post/${id}`}
                                            >
                                                <Heading fontSize="xl">
                                                    {title}
                                                </Heading>
                                            </NextChakraLink>

                                            <Text color="blue.400">
                                                posted by {creator.username}
                                            </Text>
                                            <Text mt={4}>{textSnippet}</Text>

                                            <EditDeletePostButtons
                                                postId={id}
                                                creatorId={creator.id}
                                            />
                                        </Box>
                                    </Flex>
                                )
                            })}
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
