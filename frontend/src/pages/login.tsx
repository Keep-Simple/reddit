import { Box, Button, Flex } from '@chakra-ui/core'
import { Form, Formik } from 'formik'
import { withUrqlClient } from 'next-urql'
import { useRouter } from 'next/router'
import React from 'react'
import { InputField } from '../components/InputField'
import { Wrapper } from '../components/Wrapper'
import { useLoginMutation } from '../generated/graphql'
import { createUrqlClient } from '../utils/createUrqlClient'
import { toErrorMap } from '../utils/toErrorMap'

const Login: React.FC = ({}) => {
    const router = useRouter()
    const [, login] = useLoginMutation()

    return (
        <Wrapper variant="small">
            <Formik
                initialValues={{ usernameOrEmail: '', password: '' }}
                onSubmit={async (values, { setErrors }) => {
                    const { data } = await login(values)

                    if (data?.login.errors) {
                        setErrors(toErrorMap(data.login.errors))
                    } else if (data?.login.user) {
                        router.push('/')
                    }
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <InputField
                            name="usernameOrEmail"
                            placeholder="usernameOrEmail"
                            label="Username | Email"
                        />
                        <Box mt={4}>
                            <InputField
                                name="password"
                                placeholder="password"
                                label="Password"
                                type="password"
                            />
                        </Box>

                        <Flex mt={4} justifyContent="space-between">
                            <Button
                                onClick={() => router.push('/forgot-password')}
                                variant="outline"
                                variantColor="teal"
                            >
                                Forgot Password
                            </Button>
                            <Button
                                isLoading={isSubmitting}
                                type="submit"
                                variantColor="teal"
                            >
                                Login
                            </Button>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    )
}

export default withUrqlClient(createUrqlClient)(Login)
