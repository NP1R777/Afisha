import { Box, Button, Flex, Image, Input, Stack, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../addition/context';
import { Field } from '../components/ui/field';
import { PasswordInput } from '../components/ui/password-input';
import icon2 from '../pictures/icon2.png';
import axios from '../shared/lib/axios';

interface FormValues {
  username: string;
  password: string;
  email: string;
  date_of_birth: string;
  preferences?: number[];
}

interface EditingModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onCreateSuccess: () => void;
}

const EditingModal: React.FC<EditingModalProps> = ({ isOpen, onRequestClose, onCreateSuccess }) => {
  const [errorMessage, setErrorMessage] = useState('');
  const { userId, username, email, date_of_birth, setUsername, setEmail, setBirthdate, logout } = useUser();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormValues>();

  const currentDate = new Date();
  currentDate.setFullYear(currentDate.getFullYear() - 7);
  const maxDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const onSubmit = handleSubmit(async data => {
    const updatedData: FormValues = {
      username: username || '',
      password: 'string',
      email: email || '',
      date_of_birth: date_of_birth ? date_of_birth.split('.').reverse().join('-') : '',
      preferences: [0],
    };

    if (data.username !== username) {
      updatedData.username = data.username;
    }
    if (data.email !== email) {
      updatedData.email = data.email;
    }
    if (data.date_of_birth !== (date_of_birth ? date_of_birth.split('.').reverse().join('-') : '')) {
      updatedData.date_of_birth = data.date_of_birth;
    }
    if (data.password) {
      updatedData.password = data.password;
    }

    console.log('Отправляемые данные:', updatedData);
    console.log('Отправляемые данные перед запросом:', JSON.stringify(updatedData));
    try {
      await axios.patch(`/user/change_data?user_id=${userId}`, updatedData);
      setUsername(data.username);
      setEmail(data.email);
      setBirthdate(data.date_of_birth);
      onCreateSuccess();
      onRequestClose();
    } catch (error) {
      console.error('Ошибка при обновлении данных:', error);
      setErrorMessage('Ошибка при обновлении данных. Пожалуйста, проверьте правильность введенных данных.');
    }
  });

  useEffect(() => {
    if (isOpen) {
      const formattedDateOfBirth = date_of_birth ? date_of_birth.split('.').reverse().join('-') : '';

      console.log('Setting form values:', { username, email, formattedDateOfBirth });
      setValue('username', username || '');
      setValue('email', email || '');
      setValue('date_of_birth', formattedDateOfBirth);
    }
  }, [isOpen, username, email, date_of_birth, setValue]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Редактирование аккаунта"
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
        padding={{ base: '30px', sm:'50px'}}
        width={{ base: '300px', sm:'400px'}}
        textAlign="center"
        mt="50px"
        mb="50px"
        position="relative"
        fontFamily="Unbounded"
      >
        <Text
          position="absolute"
          top={{ base: '15px', sm:'20px'}}
          right= '20px'
          color="white"
          cursor="pointer"
          fontSize="13px"
          userSelect="none"
          onClick={onRequestClose}
          _hover={{
            color: '#4C6BE6',
          }}
        >
          Отмена
        </Text>

        <Flex alignItems="center" gap={4}>
          <Image src={icon2} alt="icon2" objectFit="contain" userSelect="none" width="16%" />
          <Field invalid={!!errors.username} errorText={errors.username?.message}>
            <Input
              {...register('username', {
                required: 'Введите новый логин',
                minLength: { value: 5, message: 'Логин должен содержать не менее 5 символов' },
              })}
              bg="white"
              placeholder="Логин"
              borderRadius="10px"
              mt={{ base: 4, sm:0}}
            />
          </Field>
          {errorMessage && (
            <Text color="red" fontSize="sm">
              {errorMessage}
            </Text>
          )}
        </Flex>
        <form style={{ marginTop: '10px' }}>
          <Flex justify="center">
            <Stack width="100%">
              <Field invalid={!!errors.password} errorText={errors.password?.message}>
                <PasswordInput
                  {...register('password', {
                    minLength: { value: 5, message: 'Пароль должен содержать не менее 5 символов' },
                    validate: value => value === '' || value.length >= 5 || 'Пароль должен содержать не менее 5 символов',
                  })}
                  bg="white"
                  placeholder="Новый пароль"
                  borderRadius="10px"
                />
              </Field>

              <Field invalid={!!errors.email} errorText={errors.email?.message}>
                <Input
                  {...register('email', {
                    required: 'Введите новую почту',
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: 'Неверный формат email',
                    },
                  })}
                  bg="white"
                  placeholder="Email"
                  borderRadius="10px"
                />
              </Field>

              <Field invalid={!!errors.date_of_birth} errorText={errors.date_of_birth?.message}>
                <Input
                  {...register('date_of_birth', { required: 'Введите день рождение' })}
                  bg="white"
                  placeholder="Дата рождения"
                  borderRadius="10px"
                  type="date"
                  min="1900-01-01"
                  max={maxDate}
                />
              </Field>
              <Button
                onClick={onSubmit}
                type="submit"
                bg="#22212C"
                color="white"
                fontSize="17px"
                fontWeight="600"
                borderRadius="xl"
                marginTop={{ base: '0px', sm:'10px'}}
                _hover={{
                  bg: '#4C6BE6',
                  color: 'white',
                }}
              >
                Сохранить
              </Button>
              <Button
                type="submit"
                bg="white"
                color="#8B8B8B"
                fontSize="17px"
                fontWeight="600"
                borderRadius="xl"
                onClick={handleLogout}
                _hover={{ bg: '#4C6BE6', color: 'white' }}
              >
                Выйти из аккаунта
              </Button>
              {/* <Button
                onClick={handleDeleteProfile}
                type="submit"
                bg="white"
                color="#8B8B8B"
                fontSize="17px"
                fontWeight="600"
                borderRadius="xl"
                _hover={{ bg: '#4C6BE6', color: 'white' }}
              >
                Удалить профиль
              </Button> */}
            </Stack>
          </Flex>
        </form>
      </Box>
    </Modal>
  );
};

export default EditingModal;
