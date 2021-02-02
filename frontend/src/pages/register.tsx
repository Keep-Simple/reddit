import { Box, Button } from '@chakra-ui/core'
import { Form, Formik } from 'formik'
import { useRouter } from 'next/router'
import { InputField } from '../components/InputField'
import { Wrapper } from '../components/Wrapper'
import { useRegisterMutation } from '../generated/graphql'
import { toErrorMap } from '../utils/toErrorMap'
interface registerProps {}

const Register: React.FC<registerProps> = ({}) => {
    const router = useRouter()
    const [register] = useRegisterMutation()

    return (
        <Wrapper variant="small">
            <Formik
                initialValues={{ username: '', password: '', email: '' }}
                onSubmit={async (values, { setErrors }) => {
                    const { data } = await register({
                        variables: { options: values },
                    })

                    if (data?.register.errors) {
                        setErrors(toErrorMap(data.register.errors))
                    } else if (data?.register.user) {
                        router.back()
                    }
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <InputField
                            name="email"
                            placeholder="any@mail.com"
                            label="Email"
                        />
                        <Box mt={4}>
                            <InputField
                                name="username"
                                placeholder="username"
                                label="Username"
                            />
                        </Box>
                        <Box mt={4}>
                            <InputField
                                name="password"
                                placeholder="password"
                                label="Password"
                                type="password"
                            />
                        </Box>
                        <Button
                            mt={4}
                            isLoading={isSubmitting}
                            type="submit"
                            variantColor="teal"
                        >
                            Register
                        </Button>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    )
}

export default Register
