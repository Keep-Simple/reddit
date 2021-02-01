import { Heading } from '@chakra-ui/core'
import { withUrqlClient } from 'next-urql'
import React from 'react'
import AlertUI from '../../components/Alert'
import { EditDeletePostButtons } from '../../components/EditDeletePostButtons'
import { Layout } from '../../components/Layout'
import { Loading } from '../../components/Loading'
import { usePostQuery } from '../../generated/graphql'
import { createUrqlClient } from '../../utils/createUrqlClient'
import { useGetQueryId } from '../../utils/useGetQueryId'

const Post: React.FC<{}> = ({}) => {
    const postId = useGetQueryId()

    const [{ data, fetching }] = usePostQuery({
        pause: postId === -1,
        variables: { id: postId },
    })

    if (fetching) {
        return (
            <Layout>
                <Loading />
            </Layout>
        )
    }

    if (!data?.post) {
        return (
            <Layout>
                <AlertUI message="Couldn't find this post" />
            </Layout>
        )
    }

    const { title, text } = data.post

    return (
        <Layout>
            <Heading mb={4}>{title}</Heading>
            {text}

            <EditDeletePostButtons
                postId={postId}
                creatorId={data.post.creator.id}
            />
        </Layout>
    )
}

export default withUrqlClient(createUrqlClient, { ssr: true })(Post)
