import { Box, Button } from '@chakra-ui/core'
import { Formik, Form } from 'formik'
import { withUrqlClient } from 'next-urql'
import { useRouter } from 'next/router'
import AlertUI from '../../../components/Alert'
import { InputField } from '../../../components/InputField'
import { Layout } from '../../../components/Layout'
import { Loading } from '../../../components/Loading'
import { usePostQuery, useUpdatePostMutation } from '../../../generated/graphql'
import { createUrqlClient } from '../../../utils/createUrqlClient'
import { useGetQueryId } from '../../../utils/useGetQueryId'
import { useIsAuth } from '../../../utils/useIsAuth'

const EditPost: React.FC<{}> = () => {
    useIsAuth()
    const router = useRouter()
    const postId = useGetQueryId()
    const [, updatePost] = useUpdatePostMutation()

    const [{ data, fetching }] = usePostQuery({
        variables: { id: postId },
        pause: postId === -1,
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
                <AlertUI message="post not found" />
            </Layout>
        )
    }

    return (
        <Layout variant="small">
            <Formik
                initialValues={{
                    title: data.post.title,
                    text: data.post.text,
                    id: postId,
                }}
                onSubmit={async (values) => {
                    const { error } = await updatePost(values)
                    if (!error) router.back()
                }}
                enableReinitialize
            >
                {({ isSubmitting }) => (
                    <Form>
                        <InputField
                            name="title"
                            placeholder="The Great Title"
                            label="Post Title"
                        />
                        <Box mt={4}>
                            <InputField
                                name="text"
                                placeholder="Start your awasome post..."
                                label="Body"
                                textarea
                            />
                        </Box>
                        <Button
                            mt={4}
                            isLoading={isSubmitting}
                            type="submit"
                            variantColor="teal"
                        >
                            Update Post
                        </Button>
                    </Form>
                )}
            </Formik>
        </Layout>
    )
}

export default withUrqlClient(createUrqlClient, { ssr: true })(EditPost)
