import { Box, Button, createListCollection, Flex, Input, Stack, Text, Textarea, useBreakpointValue } from '@chakra-ui/react';
import { FormEvent, useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import Modal from 'react-modal';
import { Field } from '../components/ui/field';
import { SelectContent, SelectItem, SelectRoot, SelectTrigger } from '../components/ui/select';
import axios from '../shared/lib/axios';
import { Toaster, toaster } from "../components/ui/toaster"

interface FormValues {
  name: string;
  description: string;
  group_id: string;
  category: string;
  external_url: string;
  date_event: string;
  duration: string;
  price: string;
  address: string;
  city: string;
  location: string;
  age_limit: string;
  pictures_url: string;
  horizontal_picture_url: string;
}

interface CreateModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onCreateSuccess: () => void;
}

const CreateModal: React.FC<CreateModalProps> = ({ isOpen, onRequestClose, onCreateSuccess }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const onSubmit = handleSubmit(async data => {
    try {
      if (!selectedCategoryId) {
        console.error('Категория не выбрана');
        return;
      }

      // await axios.post('/event/create_event', {
      //   ...data,
      //   group_id: selectedCategoryId,
      // });
      toaster.create({
        title: 'Созданное мероприятие отправлено на модерацию.',
        duration: 5000
      });
      onCreateSuccess();
      onRequestClose();
    } catch (err) {
      console.error('Ошибка при создании мероприятия:', err);
    }
  });

  const categories = createListCollection({
    items: [
      { label: 'Театр', value: '1' },
      { label: 'Кино', value: '3' },
      { label: 'Спорт', value: '5' },
      { label: 'Культура', value: '6' },
      { label: 'Музыка', value: '7' },
    ],
  });

  const handleCategoryChange = (event: FormEvent<HTMLDivElement>) => {
    const value = (event.target as HTMLSelectElement).value;
    setSelectedCategoryId(value);
    console.log('Выбранная категория ID:', value);
  };

  const topValue = useBreakpointValue({ base: '60%', md: '50%' });
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Создать мероприятие"
      style={{
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 2,
        },
        content: {
          top: topValue,
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          padding: '0',
          background: 'none',
          border: 'none',

        },
      }}
    >
      <Box
        bg="#BCC7F6"
        borderRadius="20px"
        padding={{ base: '15px', md: '30px' }}
        width={{ base: '250px', md: '600px' }}
        textAlign="center"
        mt="50px"
        mb="50px"
        position="relative"
        fontFamily="Unbounded"
        overflow={{ base: 'scroll', md:'auto'  }}
        height={{ base: '500px' }}
      >
        <Text
          position="absolute"
          top={{ base: '11px', md: '20px' }}
          right="20px"
          color="white"
          cursor="pointer"
          fontSize={{ base: '10px', md: '13px' }}
          userSelect="none"
          onClick={onRequestClose}
          _hover={{
            color: '#4C6BE6',
          }}
        >
          Отмена
        </Text>

        <form onSubmit={onSubmit} style={{ marginTop: '20px' }}>
          <Flex gap={{ base: '2', md: '4' }} justify="center"  direction={{ base: 'column', md: 'row' }}>
            <Stack width={{ base: '100%', md: '46%' }} >
              <Field invalid={!!errors.name} errorText={errors.name?.message}>
                <Input
                  {...register('name', { required: 'Введите название мероприятия' })}
                  bg="white"
                  placeholder="Название мероприятия"
                  borderRadius="10px"
                />
              </Field>

              <SelectRoot
                multiple
                collection={categories}
                size={{ base: 'xs', md: 'md'}}
                width={{ base: '220px', md: '250px' }}
                bg="white"
                overflow="hidden"
                borderRadius="10px"
                onChange={handleCategoryChange}
              >
                <SelectTrigger>
                  <Box as="span" fontSize={{ base: '13px', md: '15px' }} color="GrayText" cursor="pointer">
                    Все события
                  </Box>
                </SelectTrigger>
                <SelectContent>
                  {categories.items.map(category => (
                    <SelectItem item={category} key={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>

              <Field invalid={!!errors.city} errorText={errors.city?.message}>
                <Input
                  {...register('city', { required: 'Введите Норилськ, Талнах, Кайеркан и т.д.)' })}
                  bg="white"
                  placeholder="Район мероприятия"
                  borderRadius="10px"
                />
              </Field>

              <Field invalid={!!errors.location} errorText={errors.location?.message}>
                <Input
                  {...register('location', { required: 'Пожалуйста введите место проведения' })}
                  bg="white"
                  placeholder="Место проведения"
                  borderRadius="10px"
                />
              </Field>

              <Field invalid={!!errors.address} errorText={errors.address?.message}>
                <Input
                  {...register('address', { required: 'Введите пожалуйста адрес мероприятия' })}
                  bg="white"
                  placeholder="Адрес мероприятия"
                  borderRadius="10px"
                />
              </Field>

              <Field invalid={!!errors.price} errorText={errors.price?.message}>
                <Input
                  {...register('price', {
                    required: 'Введите цену посещения мероприятия',
                    pattern: {
                      value: /^\d+$/,
                      message: 'Пожалуйста, введите только цифры',
                    },
                  })}
                  bg="white"
                  placeholder="Цена"
                  borderRadius="10px"
                />
              </Field>
            </Stack>

            <Stack width={{ base: '100%', md: '46%' }}>
              <Field invalid={!!errors.pictures_url} errorText={errors.pictures_url?.message} flex="0 0 auto">
                <Input
                  {...register('pictures_url', { required: 'Введите URL вертикальной картинки' })}
                  bg="white"
                  placeholder="Вертикальная картинка"
                  borderRadius="10px"
                />
              </Field>
              <Field invalid={!!errors.horizontal_picture_url} errorText={errors.horizontal_picture_url?.message}>
                <Input {...register('horizontal_picture_url', {})} bg="white" placeholder="Горизонтальная картинка" borderRadius="10px" />
              </Field>

              <Field invalid={!!errors.external_url} errorText={errors.external_url?.message}>
                <Input
                  {...register('external_url', { required: 'Введите ссылку на ваш сервис' })}
                  bg="white"
                  placeholder="Ссылка на источник"
                  borderRadius="10px"
                />
              </Field>
              <Field invalid={!!errors.age_limit} errorText={errors.age_limit?.message}>
                <Input
                  {...register('age_limit', {
                    required: 'Введите возрастное ограничение',
                    pattern: {
                      value: /^(0|6|12|16|18)$/,
                      message: 'Возрастное ограничение должно быть одним из следующих значений: 0, 6, 12, 16, 18',
                    },
                  })}
                  bg="white"
                  placeholder="Возрастное ограничение"
                  borderRadius="10px"
                />
              </Field>

              <Field invalid={!!errors.duration} errorText={errors.duration?.message}>
                <Input
                  {...register('duration', {
                    required: 'Введите время начала вашего мероприятия',
                    pattern: {
                      value: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
                      message: 'Пожалуйста, введите время в формате ЧЧ:ММ',
                    },
                  })}
                  bg="white"
                  placeholder="Время начала"
                  borderRadius="10px"
                />
              </Field>

              <Field invalid={!!errors.date_event} errorText={errors.date_event?.message}>
                <Input
                  {...register('date_event', {
                    required: 'Введите дату начала мероприятия',
                    min: {
                      value: new Date().toISOString().split('T')[0],
                      message: 'Дата начала мероприятия должна быть в будущем',
                    },
                  })}
                  bg="white"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  borderRadius="10px"
                />
              </Field>
            </Stack>
          </Flex>

          <Flex justify="center" mt={{ base: '2', md: '4' }}>
            <Box width={{ base: '80%', md: '50%' }}>
              <Field invalid={!!errors.description} errorText={errors.description?.message}>
                <Textarea
                  {...register('description', { required: 'Введите описание мероприятия' })}
                  bg="white"
                  placeholder="Описание мероприятия"
                  borderRadius="10px"
                />
              </Field>
            </Box>
          </Flex>

          <Flex w="100%" justify="center" mt={{ base: '2', md: '4' }}>
            <Button
              type="submit"
              bg="#22212C"
              color="white"
              fontSize="17px"
              fontWeight="600"
              w={{ base: '60%', md: '40%' }}
              borderRadius="xl"
              _hover={{
                bg: '#4C6BE6',
                color: 'white',
              }}
            >
              Создать
            </Button>
          </Flex>
        </form>
      </Box>
    </Modal>
  );
};

export default CreateModal;
