import { Box, Button, createListCollection, Flex, Input, Stack, Text, Textarea, useBreakpointValue } from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from 'react-modal';
import { Field } from '../components/ui/field';
import { SelectContent, SelectItem, SelectRoot, SelectTrigger } from '../components/ui/select';
import axios from '../shared/lib/axios';
import { toaster } from "../components/ui/toaster";

interface FormValues {
  name: string;
  description: string;
  external_url: string;
  date_event: string;
  start_time: string;
  price: string;
  address: string;
  pictures_main: string;
  pictures_two: string;
}

interface GroupOption {
  id: number;
  name: string;
}

interface CreateModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onCreateSuccess: () => void;
  initialDate?: string | null;
}

const CITY_OPTIONS = createListCollection({
  items: [
    { label: 'Норильск', value: 'norilsk' },
    { label: 'Талнах', value: 'talnah' },
    { label: 'Кайеркан', value: 'kayerkan' },
    { label: 'Оганер', value: 'oganeer' },
    { label: 'Дудинка', value: 'dudinka' },
  ],
});

const AGE_OPTIONS = createListCollection({
  items: [
    { label: '0+', value: '0+' },
    { label: '6+', value: '6+' },
    { label: '12+', value: '12+' },
    { label: '16+', value: '16+' },
    { label: '18+', value: '18+' },
  ],
});

const CreateModal: React.FC<CreateModalProps> = ({ isOpen, onRequestClose, onCreateSuccess, initialDate }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      external_url: '',
      date_event: '',
      start_time: '',
      price: '',
      address: '',
      pictures_main: '',
      pictures_two: '',
    },
  });

  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedGroupLabel, setSelectedGroupLabel] = useState('Категория');
  const [groupOptions, setGroupOptions] = useState<GroupOption[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCityLabel, setSelectedCityLabel] = useState('Район мероприятия');
  const [selectedAge, setSelectedAge] = useState('');
  const [selectedAgeLabel, setSelectedAgeLabel] = useState('Возрастное ограничение');

  const categoryCollection = useMemo(
    () =>
      createListCollection({
        items: groupOptions.map((item) => ({ label: item.name, value: String(item.id) })),
      }),
    [groupOptions]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset({
      name: '',
      description: '',
      external_url: '',
      date_event: initialDate || '',
      start_time: '',
      price: '',
      address: '',
      pictures_main: '',
      pictures_two: '',
    });
    setSelectedGroupId('');
    setSelectedGroupLabel('Категория');
    setSelectedCity('');
    setSelectedCityLabel('Район мероприятия');
    setSelectedAge('');
    setSelectedAgeLabel('Возрастное ограничение');
  }, [initialDate, isOpen, reset]);

  useEffect(() => {
    let isCancelled = false;
    const loadGroups = async () => {
      if (!isOpen) {
        return;
      }
      setGroupsLoading(true);
      try {
        const response = await axios.get('/event/event_list');
        const rows = Array.isArray(response.data) ? response.data : [];
        const mapped = rows
          .map((item: any) => ({
            id: Number(item?.id),
            name: String(item?.name || '').trim(),
          }))
          .filter((item: GroupOption) => Number.isFinite(item.id) && item.id > 0 && item.name.length > 0);
        if (!isCancelled) {
          setGroupOptions(mapped);
        }
      } catch {
        if (!isCancelled) {
          setGroupOptions([]);
        }
      } finally {
        if (!isCancelled) {
          setGroupsLoading(false);
        }
      }
    };
    void loadGroups();
    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  const handleCategoryChange = (details: any) => {
    const value = details?.value?.[0] || '';
    setSelectedGroupId(value);
    const found = categoryCollection.items.find((item) => item.value === value);
    setSelectedGroupLabel(found?.label || 'Категория');
  };

  const handleCityChange = (details: any) => {
    const value = details?.value?.[0] || '';
    setSelectedCity(value);
    const found = CITY_OPTIONS.items.find((item) => item.value === value);
    setSelectedCityLabel(found?.label || 'Район мероприятия');
  };

  const handleAgeChange = (details: any) => {
    const value = details?.value?.[0] || '';
    setSelectedAge(value);
    const found = AGE_OPTIONS.items.find((item) => item.value === value);
    setSelectedAgeLabel(found?.label || 'Возрастное ограничение');
  };

  const onSubmit = handleSubmit(async (data) => {
    if (!selectedGroupId) {
      toaster.create({
        title: 'Выбери категорию мероприятия.',
        duration: 3500,
      });
      return;
    }
    if (!selectedCity) {
      toaster.create({
        title: 'Выбери район мероприятия.',
        duration: 3500,
      });
      return;
    }
    if (!selectedAge) {
      toaster.create({
        title: 'Выбери возрастное ограничение.',
        duration: 3500,
      });
      return;
    }

    try {
      const priceValue = (data.price || '').trim();
      const payload = {
        name: data.name.trim(),
        description: (data.description || '').trim() || null,
        organization: null,
        city: selectedCity,
        price: priceValue ? Number(priceValue) : null,
        address: (data.address || '').trim() || null,
        age_limit: selectedAge,
        pictures_main: (data.pictures_main || '').trim() || null,
        pictures_two: (data.pictures_two || '').trim() || null,
        external_url: (data.external_url || '').trim() || null,
        group_ids: [Number(selectedGroupId)],
        times: [
          {
            date_event: `${data.date_event}T00:00:00`,
            start_time: data.start_time,
          },
        ],
      };

      await axios.post('/event/create_event', payload);
      toaster.create({
        title: 'Мероприятие создано.',
        duration: 4500,
      });
      onCreateSuccess();
      onRequestClose();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      toaster.create({
        title: typeof detail === 'string' ? detail : 'Ошибка при создании мероприятия.',
        duration: 5000,
      });
    }
  });

  const topValue = useBreakpointValue({ base: '58%', md: '50%' });
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Создать мероприятие"
      style={{
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1300,
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
        width={{ base: '280px', md: '620px' }}
        textAlign="center"
        position="relative"
        fontFamily="Unbounded"
        maxH={{ base: '75vh', md: '85vh' }}
        overflowY="auto"
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
          _hover={{ color: '#4C6BE6' }}
        >
          Отмена
        </Text>

        <form onSubmit={onSubmit} style={{ marginTop: '20px' }}>
          <Flex gap={{ base: '2', md: '4' }} justify="center" direction={{ base: 'column', md: 'row' }}>
            <Stack width={{ base: '100%', md: '46%' }}>
              <Field invalid={!!errors.name} errorText={errors.name?.message}>
                <Input
                  {...register('name', { required: 'Введите название мероприятия' })}
                  bg="white"
                  placeholder="Название мероприятия"
                  borderRadius="10px"
                />
              </Field>

              <SelectRoot
                collection={categoryCollection}
                size={{ base: 'xs', md: 'md' }}
                width={{ base: '100%', md: '250px' }}
                bg="white"
                overflow="hidden"
                borderRadius="10px"
                onValueChange={handleCategoryChange}
                disabled={groupsLoading}
              >
                <SelectTrigger>
                  <Box as="span" fontSize={{ base: '13px', md: '14px' }} color={selectedGroupId ? 'black' : 'GrayText'}>
                    {groupsLoading ? 'Загрузка категорий...' : selectedGroupLabel}
                  </Box>
                </SelectTrigger>
                <SelectContent>
                  {categoryCollection.items.map((item) => (
                    <SelectItem item={item} key={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>

              <SelectRoot
                collection={CITY_OPTIONS}
                size={{ base: 'xs', md: 'md' }}
                width={{ base: '100%', md: '250px' }}
                bg="white"
                overflow="hidden"
                borderRadius="10px"
                onValueChange={handleCityChange}
              >
                <SelectTrigger>
                  <Box as="span" fontSize={{ base: '13px', md: '14px' }} color={selectedCity ? 'black' : 'GrayText'}>
                    {selectedCityLabel}
                  </Box>
                </SelectTrigger>
                <SelectContent>
                  {CITY_OPTIONS.items.map((item) => (
                    <SelectItem item={item} key={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>

              <Field invalid={!!errors.address} errorText={errors.address?.message}>
                <Input
                  {...register('address', { required: 'Введите адрес мероприятия' })}
                  bg="white"
                  placeholder="Адрес мероприятия"
                  borderRadius="10px"
                />
              </Field>

              <Field invalid={!!errors.price} errorText={errors.price?.message}>
                <Input
                  {...register('price', {
                    pattern: {
                      value: /^\d*(?:[.,]\d{1,2})?$/,
                      message: 'Цена должна быть числом',
                    },
                  })}
                  bg="white"
                  placeholder="Цена (опционально)"
                  borderRadius="10px"
                />
              </Field>

              <Field invalid={!!errors.external_url} errorText={errors.external_url?.message}>
                <Input
                  {...register('external_url')}
                  bg="white"
                  placeholder="Ссылка на организатора (опционально)"
                  borderRadius="10px"
                />
              </Field>
            </Stack>

            <Stack width={{ base: '100%', md: '46%' }}>
              <Field invalid={!!errors.pictures_main} errorText={errors.pictures_main?.message}>
                <Input
                  {...register('pictures_main')}
                  bg="white"
                  placeholder="Ссылка на афишу (опционально)"
                  borderRadius="10px"
                />
              </Field>

              <Field invalid={!!errors.pictures_two} errorText={errors.pictures_two?.message}>
                <Input
                  {...register('pictures_two')}
                  bg="white"
                  placeholder="Ссылка на вторую картинку (опционально)"
                  borderRadius="10px"
                />
              </Field>

              <SelectRoot
                collection={AGE_OPTIONS}
                size={{ base: 'xs', md: 'md' }}
                width={{ base: '100%', md: '250px' }}
                bg="white"
                overflow="hidden"
                borderRadius="10px"
                onValueChange={handleAgeChange}
              >
                <SelectTrigger>
                  <Box as="span" fontSize={{ base: '13px', md: '14px' }} color={selectedAge ? 'black' : 'GrayText'}>
                    {selectedAgeLabel}
                  </Box>
                </SelectTrigger>
                <SelectContent>
                  {AGE_OPTIONS.items.map((item) => (
                    <SelectItem item={item} key={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>

              <Field invalid={!!errors.start_time} errorText={errors.start_time?.message}>
                <Input
                  type="time"
                  {...register('start_time', { required: 'Введите время начала мероприятия' })}
                  bg="white"
                  borderRadius="10px"
                />
              </Field>

              <Field invalid={!!errors.date_event} errorText={errors.date_event?.message}>
                <Input
                  {...register('date_event', {
                    required: 'Введите дату мероприятия',
                    min: {
                      value: minDate,
                      message: 'Дата мероприятия должна быть не раньше сегодняшней',
                    },
                  })}
                  bg="white"
                  type="date"
                  min={minDate}
                  borderRadius="10px"
                />
              </Field>
            </Stack>
          </Flex>

          <Flex justify="center" mt={{ base: '2', md: '4' }}>
            <Box width={{ base: '100%', md: '72%' }}>
              <Field invalid={!!errors.description} errorText={errors.description?.message}>
                <Textarea
                  {...register('description')}
                  bg="white"
                  placeholder="Описание мероприятия (опционально)"
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
              w={{ base: '70%', md: '45%' }}
              borderRadius="xl"
              loading={isSubmitting}
              _hover={{ bg: '#4C6BE6', color: 'white' }}
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
