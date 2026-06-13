import { Box, Flex, Heading, Input, Button, Image, Stack, Text } from '@chakra-ui/react';
import { Field } from '../components/ui/field';
import { PasswordInput } from '../components/ui/password-input';
import { useForm } from 'react-hook-form';
import icon from '../pictures/icon.png';
import axios from '../shared/lib/axios';
import React, { useState } from 'react';
import Modal from 'react-modal';
import { useUser } from '../addition/context';

interface FormValues {
  username: string;
  password: string;
}

interface LoginModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  openRegisterModal: () => void;
  onLoginSuccess: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onRequestClose, openRegisterModal, onLoginSuccess }) => {
  const { setUsername, setUserId, setRole, login, setCategories } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = handleSubmit(async data => {
    try {
      const response = await axios.post('/user/login', data);
      if (response.status === 200) {
        const { user_id: userId, username } = response.data;
        localStorage.setItem('userId', userId);
        localStorage.setItem('username', username);
        setUsername(username);
        setUserId(userId);

        console.log('User ID:', userId);
        console.log('Username:', username);

        const categoriesResponse = await axios.get(`/user/get_user?user_id=${userId}`);
        if (categoriesResponse.status === 200) {
          const categoriesData = categoriesResponse.data;
          setCategories(categoriesData.preferences);
          setRole(categoriesData.role || null);

          // categoriesData.preferences
        } else {
          console.error('Failed to fetch preferences');
        }

        login();
        onLoginSuccess();
        handleClose();
      }
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        setErrorMessage('Неверный логин или пароль');
      } else {
        console.error('Error logging in:', error);
      }
    }
  });

  const handleClose = () => {
    reset();
    setErrorMessage(null);
    onRequestClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onRequestClose={handleClose}
        contentLabel="Login Modal"
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 100,
          },
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '0',
            background: 'none',
            border: 'none',
            overflow: 'visible',
          },
        }}
      >
        <Box bg="gray.800" borderRadius="20px" padding={{ base: '30px', lg:'40px'}} width={{ base: '300px', lg:'400px'}} boxShadow="0px 4px 32px rgba(0, 0, 0, 0.25)" textAlign="center">
          <Flex justifyContent="center" alignItems="center" marginBottom="20px">
            <Image src={icon} alt="Logo" boxSize={{ base: '50px', lg:'60px'}} objectFit="contain" />
          </Flex>
          <Heading as="h1" color="white" fontFamily="'Unbounded', sans-serif" fontSize={{ base: '25px', lg:'33px'}} fontWeight="700" mb={{ base: 4, lg:8}} userSelect="none">
            Здравствуйте!
          </Heading>

          <form onSubmit={onSubmit}>
            <Stack gap="4" align="flex-start" maxW="sm">
              <Field invalid={!!errors.username} errorText={errors.username?.message}>
                <Input
                  {...register('username', { required: 'Введите логин', minLength: { value: 5, message: 'Логин не может быть менее 5 символов' } })}
                  bg="white"
                  placeholder="Логин"
                />
              </Field>

              <Field invalid={!!errors.password} errorText={errors.password?.message}>
                <PasswordInput
                  {...register('password', { required: 'Введите пароль', minLength: { value: 5, message: 'Пароль не может быть менее 5 символов' } })}
                  bg="white"
                  placeholder="Пароль"
                />
              </Field>
              {errorMessage && (
                <Text color="red.500" fontWeight="semibold" fontSize="xs">
                  {errorMessage}
                </Text>
              )}
              <Flex w="100%">
                <Button
                  type="submit"
                  bg="#A0B1CC"
                  color="white"
                  fontSize="20px"
                  fontWeight="600"
                  padding="15px"
                  boxShadow="0px 4px 32px rgba(114, 150, 204, 0.5)"
                  _hover={{ bg: '#7296CC' }}
                  w="100%"
                >
                  Войти в аккаунт
                </Button>
              </Flex>
            </Stack>
          </form>
          <Text
            mt="3"
            color="#A0A0A4"
            _hover={{ textDecoration: 'underline', cursor: 'pointer' }}
            onClick={() => {
              openRegisterModal();
              handleClose();
            }}
          >
            Или создайте аккаунт тут
          </Text>
        </Box>
      </Modal>
    </>
  );
};

export default LoginModal;
