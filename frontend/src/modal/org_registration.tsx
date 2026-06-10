import { Box, Button, Flex, Heading, Image, Input, Stack, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from 'react-modal';
import { Field } from '../components/ui/field';
import { PasswordInput } from '../components/ui/password-input';
import icon from '../pictures/icon.png';

interface FormValues {
  username: string;
  password: string;
  mail: string;
  birthdate: string;
}

interface OrganizerRegisterModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  openLoginModal: () => void;
}

const OrganizerRegisterModal: React.FC<OrganizerRegisterModalProps> = ({
  isOpen,
  onRequestClose,
  openLoginModal,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = handleSubmit(async data => {
    try {
      console.log('Organizer registration:', data);

      reset();
      onRequestClose();
    } catch (error) {
      console.error(error);
      setErrorMessage('Произошла ошибка. Попробуйте позже');
    }
  });

  const currentDate = new Date();
  currentDate.setFullYear(currentDate.getFullYear() - 7);

  const maxDate = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1
  ).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={() => {
        reset();
        setErrorMessage('');
        onRequestClose();
      }}
      contentLabel="Organizer Register Modal"
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
        bg="#BCC7F6"
        borderRadius="20px"
        padding={{ base: '30px', md: '40px' }}
        width={{ base: '300px', md: '400px' }}
        boxShadow="0px 4px 32px rgba(0, 0, 0, 0.25)"
        textAlign="center"
        mt="50px"
        mb="50px"
      >
        <Flex justifyContent="center" alignItems="center" marginBottom="20px">
          <Image
            src={icon}
            alt="Logo"
            boxSize={{ base: '50px', md: '60px' }}
            objectFit="contain"
          />
        </Flex>

        <Heading
          as="h1"
          color="white"
          fontFamily="'Unbounded', sans-serif"
          fontSize={{ base: '25px', md: '29px' }}
          fontWeight="700"
          mb="6"
          userSelect="none"
        >
          Регистрация организатора
        </Heading>

        <form onSubmit={onSubmit}>
          <Stack gap="4" align="flex-start" maxW="sm">
            <Field invalid={!!errors.username} errorText={errors.username?.message}>
              <Input
                {...register('username', {
                  required: 'Введите логин',
                  minLength: {
                    value: 5,
                    message: 'Логин должен содержать не менее 5 символов',
                  },
                })}
                bg="white"
                placeholder="Логин"
              />
            </Field>

            {errorMessage && (
              <Text color="red.200" fontSize="sm">
                {errorMessage}
              </Text>
            )}

            <Field invalid={!!errors.password} errorText={errors.password?.message}>
              <PasswordInput
                {...register('password', {
                  required: 'Введите пароль',
                  minLength: {
                    value: 5,
                    message: 'Пароль должен содержать не менее 5 символов',
                  },
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
                    value:
                      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: 'Неверный формат email',
                  },
                })}
                bg="white"
                placeholder="Email"
              />
            </Field>

            <Field invalid={!!errors.birthdate} errorText={errors.birthdate?.message}>
              <Input
                {...register('birthdate', {
                  required: 'Введите дату своего рождения',
                })}
                bg="white"
                type="date"
                min="1900-01-01"
                max={maxDate}
              />
            </Field>

            <Flex w="100%">
              <Button
                type="submit"
                bg="black"
                color="white"
                fontSize="20px"
                fontWeight="600"
                padding="15px"
                _hover={{ bg: '#222222' }}
                w="100%"
              >
                Продолжить
              </Button>
            </Flex>
          </Stack>
        </form>

        {/* <Text
          mt="4"
          color="white"
          cursor="pointer"
          display="block"
          _hover={{ textDecoration: 'underline' }}
          onClick={() => {
            onRequestClose();
            openLoginModal();
          }}
        >
          Или войдите в аккаунт тут, если уже зарегистрированы
        </Text> */}
      </Box>
    </Modal>
  );
};

export default OrganizerRegisterModal;