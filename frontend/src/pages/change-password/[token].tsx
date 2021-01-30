import { Button } from '@chakra-ui/core'
import { Formik, Form } from 'formik'
import { useRouter } from 'next/router'
import { InputField } from '../../components/InputField'
import { Wrapper } from '../../components/Wrapper'
import { useChangePasswordMutation } from '../../generated/graphql'
import { toErrorMap } from '../../utils/toErrorMap'

const ChangePassword: React.FC = () => {
    const router = useRouter()
    const [, changePassword] = useChangePasswordMutation()
    const token = router.query.token as string

    return (
        <Wrapper variant="small">
            <Formik
                initialValues={{ newPassword: '' }}
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
                {({ isSubmitting }) => (
                    <Form>
                        <InputField
                            name="newPassword"
                            placeholder="new password"
                            label="New Password"
                            type="password"
                        />
                        <Button
                            mt={4}
                            isLoading={isSubmitting}
                            type="submit"
                            variantColor="teal"
                        >
                            change password
                        </Button>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    )
}

export default ChangePassword
