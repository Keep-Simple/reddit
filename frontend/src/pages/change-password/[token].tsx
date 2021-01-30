import { withUrqlClient } from 'next-urql'
import { useRouter } from 'next/router'
import { Button } from '@chakra-ui/core'
import { Formik, Form } from 'formik'

import AlertUI from '../../components/Alert'
import { InputField } from '../../components/InputField'
import { Wrapper } from '../../components/Wrapper'

import { useChangePasswordMutation } from '../../generated/graphql'
import { createUrqlClient } from '../../utils/createUrqlClient'
import { toErrorMap } from '../../utils/toErrorMap'

const ChangePassword: React.FC = () => {
    const router = useRouter()
    const [, changePassword] = useChangePasswordMutation()
    const token = router.query.token as string

    return (
        <Wrapper variant="small">
            <Formik
                initialValues={{ newPassword: '', tokenError: '' }}
                onSubmit={async (values, { setErrors }) => {
                    const { data } = await changePassword({
                        newPassword: values.newPassword,
                        token,
                    })

                    if (data?.changePassword.errors) {
                        setErrors(toErrorMap(data.changePassword.errors))
                    } else if (data?.changePassword.user) {
                        router.push('/')
                    }
                }}
            >
                {({ isSubmitting, errors: { tokenError } }) => (
                    <Form>
                        <InputField
                            name="newPassword"
                            placeholder="new password"
                            label="New Password"
                            type="password"
                        />

                        <AlertUI message={tokenError} />

                        {tokenError ? (
                            <Button
                                mt={4}
                                onClick={() => router.push('/forgot-password')}
                                variantColor="teal"
                                variant="outline"
                            >
                                Resend Email
                            </Button>
                        ) : (
                            <Button
                                mt={4}
                                isLoading={isSubmitting}
                                type="submit"
                                variantColor="teal"
                            >
                                Change Password
                            </Button>
                        )}
                    </Form>
                )}
            </Formik>
        </Wrapper>
    )
}

export default withUrqlClient(createUrqlClient)(ChangePassword)
