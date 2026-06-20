import { Box, Button, Flex, Heading, Image, Input, Stack, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from 'react-modal';
import { useUser } from '../addition/context';
import { Field } from '../components/ui/field';
import { PasswordInput } from '../components/ui/password-input';
import icon from '../pictures/icon.png';
import axios from '../shared/lib/axios';
import CategoriesModal from './categories';
import OrganizerRegisterModal from '../modal/org_registration';

interface FormValues {
  username: string;
  password: string;
  mail: string;
  birthdate: string;
}

interface RegisterModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  openLoginModal: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onRequestClose, openLoginModal }) => {
  const { setUsername, setUserId, login, setCategories } = useUser();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);

  const [isOrganizerModalOpen, setIsOrganizerModalOpen] = useState(false);
  const onSubmit = handleSubmit(async data => {
    try {
      const response = await axios.post('/user/registration', {
        username: data.username,
        password: data.password,
        email: data.mail,
        date_of_birth: data.birthdate,
        preferences: [],
      });

      const { id: userId, username, preferences } = response.data;
      setUserId(userId);
      setUsername(data.username);
      setCategories(preferences);

      localStorage.setItem('userId', userId);
      localStorage.setItem('username', username);
      login();
      reset();
      onRequestClose();
      setIsCategoriesModalOpen(true);
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 400 || error.response.status === 500) {
          setErrorMessage('Такой пользователь уже существует');
        } else {
          console.error('Ошибка регистрации пользователя:', error);
          setErrorMessage('Произошла ошибка. Попробуйте позже');
        }
      } else {
        console.error('Ошибка сети или другая ошибка:', error);
        setErrorMessage('Такой пользователь уже существует');
      }
    }
  });

  const currentDate = new Date();
  currentDate.setFullYear(currentDate.getFullYear() - 7);
  const maxDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onRequestClose={() => {
          reset();
          setErrorMessage('');
          onRequestClose();
        }}
        contentLabel="Register Modal"
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
        <Box
          bg="gray.800"
          borderRadius="20px"
          padding={{ base: '30px', md:'40px'}}
          width={{ base: '300px', md:'400px'}}
          boxShadow="0px 4px 32px rgba(0, 0, 0, 0.25)"
          textAlign="center"
          mt="50px"
          mb="50px"
        >
          <Flex justifyContent="center" alignItems="center" marginBottom="20px">
            <Image src={icon} alt="Logo" boxSize={{ base: '50px', md:'60px'}} objectFit="contain" />
          </Flex>
          <Heading as="h1" color="white" fontFamily="'Unbounded', sans-serif" fontSize={{ base: '25px', md:'29px'}} fontWeight="700" mb="6" userSelect="none">
            Регистрация аккаунта
          </Heading>

          <form onSubmit={onSubmit}>
            <Stack gap="4" align="flex-start" maxW="sm">
              <Field invalid={!!errors.username} errorText={errors.username?.message}>
                <Input
                  {...register('username', {
                    required: 'Введите логин',
                    minLength: { value: 5, message: 'Логин должен содержать не менее 5 символов' },
                  })}
                  bg="white"
                  placeholder="Логин"
                />
              </Field>
              {errorMessage && (
                <Text color="red" fontSize="sm">
                  {errorMessage}
                </Text>
              )}
              <Field invalid={!!errors.password} errorText={errors.password?.message}>
                <PasswordInput
                  {...register('password', {
                    required: 'Введите пароль',
                    minLength: { value: 5, message: 'Пароль должен содержать не менее 5 символов' },
                  })}
                  bg="white"
                  placeholder="Пароль"
                />
              </Field>

              <Field invalid={!!errors.mail} errorText={errors.mail?.message}>
                <Input
                  {...register('mail', {
                    required: 'Не забудьте про свой email',
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: 'Неверный формат email',
                    },
                  })}
                  bg="white"
                  placeholder="Email"
                />
              </Field>

              <Field invalid={!!errors.birthdate} errorText={errors.birthdate?.message}>
                <Input
                  {...register('birthdate', { required: 'Введите дату своего рождения' })}
                  bg="white"
                  type="date"
                  min="1900-01-01"
                  max={maxDate}
                />
              </Field>

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
                  Продолжить
                </Button>
              </Flex>
            </Stack>
          </form>
          <Text
            mt="6"
            color="#A0A0A4"
            fontSize="15px"
            textAlign="center"
          >
            Хотите публиковать свои мероприятия?
          </Text>

          <Text
            color="#A0B1CC"
            fontSize="16px"
            fontWeight="600"
            cursor="pointer"
            _hover={{ textDecoration: 'underline', color: '#7296CC' }}
            transition="0.2s"
            textAlign="center"
            onClick={() => {
              onRequestClose();
              setIsOrganizerModalOpen(true);
            }}
          >
            Подать заявку организатора
          </Text>
          <Text
            color="#A0A0A4"
            _hover={{ textDecoration: 'underline', cursor: 'pointer' }}
            onClick={() => {
              onRequestClose();
              openLoginModal();
            }}
            style={{ marginTop: '16px', display: 'block' }}
          >
            Или войдите в аккаунт тут, если уже зарегистрированы
          </Text>
        </Box>
      </Modal>
      <CategoriesModal isOpen={isCategoriesModalOpen} onRequestClose={() => setIsCategoriesModalOpen(false)} />
      <OrganizerRegisterModal
        isOpen={isOrganizerModalOpen}
        onRequestClose={() => setIsOrganizerModalOpen(false)}
        openLoginModal={openLoginModal}
      />
    </>
  );
};

export default RegisterModal;
