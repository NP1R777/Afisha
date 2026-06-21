import {
  Box,
  Button,
  Flex,
  Grid,
  Input,
  Spinner,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import Axios from 'axios';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useAdminAuth } from '../app/AdminAuthContext';
import {
  createOrganization,
  deleteOrganization,
  fetchOrganizations,
  updateOrganization,
} from '../services/adminApi';
import type { AdminOrganization } from '../types/models';

const MotionBox = motion(Box);

interface OrganizationForm {
  organizationId: number | null;
  name_org: string;
  address: string;
  organizator: string;
  description: string;
  picture_org: string;
  external_url: string;
}

const initialForm: OrganizationForm = {
  organizationId: null,
  name_org: '',
  address: '',
  organizator: '',
  description: '',
  picture_org: '',
  external_url: '',
};

function nullableText(value: string): string | null {
  const normalized = value.trim();
  return normalized || null;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (Axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    return typeof detail === 'string' ? detail : error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

const AdminOrganizationsPage: React.FC = () => {
  const { session } = useAdminAuth();
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [form, setForm] = useState<OrganizationForm>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchOrganizations({ limit: 500 }, session);
      setOrganizations(payload.items);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Не удалось загрузить организации'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOrganizations = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) {
      return organizations;
    }
    return organizations.filter((item) =>
      [
        item.name_org,
        item.address || '',
        item.external_url || '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalized)
    );
  }, [organizations, query]);

  const resetEditor = () => {
    setForm(initialForm);
    setShowEditor(false);
  };

  const startCreate = () => {
    setError(null);
    setSuccess(null);
    setForm(initialForm);
    setShowEditor(true);
  };

  const startEdit = (organization: AdminOrganization) => {
    setError(null);
    setSuccess(null);
    setForm({
      organizationId: organization.id,
      name_org: organization.name_org || '',
      address: organization.address || '',
      organizator: organization.organizator || '',
      description: organization.description || '',
      picture_org: organization.picture_org || '',
      external_url: organization.external_url || '',
    });
    setShowEditor(true);
  };

  const buildPayload = () => ({
    name_org: form.name_org.trim(),
    address: nullableText(form.address),
    organizator: nullableText(form.organizator),
    description: nullableText(form.description),
    picture_org: nullableText(form.picture_org),
    external_url: nullableText(form.external_url),
  });

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    const payload = buildPayload();
    if (!payload.name_org) {
      setError('Название организации обязательно.');
      return;
    }

    setSaving(true);
    try {
      if (form.organizationId) {
        await updateOrganization(form.organizationId, payload, session);
        setSuccess('Организация обновлена.');
      } else {
        await createOrganization({ ...payload, name_org: payload.name_org }, session);
        setSuccess('Организация создана.');
      }
      resetEditor();
      await loadData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Не удалось сохранить организацию'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (organizationId: number) => {
    if (!window.confirm('Удалить организацию? Связанные мероприятия останутся в базе, но организация станет скрытой.')) {
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      await deleteOrganization(organizationId, session);
      if (form.organizationId === organizationId) {
        resetEditor();
      }
      setSuccess('Организация удалена.');
      await loadData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Не удалось удалить организацию'));
    }
  };

  return (
    <VStack align="stretch" gap={4}>
      <Flex justify="space-between" gap={3} wrap="wrap">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по названию, адресу или ссылке"
          maxW="420px"
          bg="white"
          color="black"
        />
        <Button onClick={startCreate} bg="#4C6BE6" color="white">
          Создать организацию
        </Button>
      </Flex>

      {error ? (
        <Box bg="rgba(255,93,93,0.15)" border="1px solid rgba(255,93,93,0.45)" borderRadius="12px" p={3} color="#ffd1d1">
          {error}
        </Box>
      ) : null}
      {success ? (
        <Box bg="rgba(69,181,116,0.15)" border="1px solid rgba(69,181,116,0.45)" borderRadius="12px" p={3} color="#bff8d2">
          {success}
        </Box>
      ) : null}

      {showEditor ? (
        <MotionBox
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          bg="rgba(26, 31, 59, 0.9)"
          border="1px solid rgba(141, 158, 255, 0.24)"
          borderRadius="16px"
          p={5}
        >
          <Text color="white" fontSize="17px" fontWeight="700" mb={4}>
            {form.organizationId ? `Редактирование организации #${form.organizationId}` : 'Создание организации'}
          </Text>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={3}>
            <Input
              value={form.name_org}
              onChange={(event) => setForm((prev) => ({ ...prev, name_org: event.target.value }))}
              placeholder="Название организации"
              bg="white"
              color="black"
            />
            <Input
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              placeholder="Адрес"
              bg="white"
              color="black"
            />
            <Input
              value={form.external_url}
              onChange={(event) => setForm((prev) => ({ ...prev, external_url: event.target.value }))}
              placeholder="Сайт организации"
              bg="white"
              color="black"
            />
            <Input
              value={form.picture_org}
              onChange={(event) => setForm((prev) => ({ ...prev, picture_org: event.target.value }))}
              placeholder="Картинка организации URL"
              bg="white"
              color="black"
            />
            <Input
              value={form.organizator}
              onChange={(event) => setForm((prev) => ({ ...prev, organizator: event.target.value }))}
              placeholder="Legacy поле organizator"
              bg="white"
              color="black"
            />
          </Grid>
          <Textarea
            mt={3}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Описание организации"
            bg="white"
            color="black"
            minH="150px"
          />
          <Flex mt={4} gap={2}>
            <Button onClick={handleSave} bg="#4C6BE6" color="white" loading={saving}>
              {form.organizationId ? 'Сохранить изменения' : 'Создать'}
            </Button>
            <Button
              variant="outline"
              borderColor="gray.500"
              color="gray.200"
              onClick={resetEditor}
            >
              Отмена
            </Button>
          </Flex>
        </MotionBox>
      ) : null}

      <Box
        bg="rgba(26, 31, 59, 0.9)"
        border="1px solid rgba(141, 158, 255, 0.24)"
        borderRadius="16px"
        p={4}
      >
        <Flex justify="space-between" align="center" mb={3} gap={3} wrap="wrap">
          <Text color="white" fontSize="16px" fontWeight="700">
            Организации ({filteredOrganizations.length})
          </Text>
          <Text color="gray.400" fontSize="12px">
            Данные таблицы info_organization
          </Text>
        </Flex>

        {loading ? (
          <Flex justify="center" py={10}>
            <Spinner color="#AFC7FF" />
          </Flex>
        ) : (
          <Box overflowX="auto">
            <Box as="table" w="100%" fontSize="13px" borderCollapse="collapse">
              <Box as="thead">
                <Box as="tr">
                  {['ID', 'Название', 'Адрес', 'Сайт', 'Картинка', 'Действия'].map((title) => (
                    <Box as="th" key={title} textAlign="left" color="gray.300" py={2} pr={3}>
                      {title}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box as="tbody">
                {filteredOrganizations.map((organization) => (
                  <Box as="tr" key={organization.id} borderTop="1px solid rgba(255,255,255,0.07)">
                    <Box as="td" py={2} pr={3} color="gray.200">
                      {organization.id}
                    </Box>
                    <Box as="td" py={2} pr={3} color="white" minW="220px">
                      <Text fontWeight="700">{organization.name_org}</Text>
                      <Text color="gray.400" fontSize="11px" lineClamp={2}>
                        {organization.description || 'Описание не заполнено'}
                      </Text>
                    </Box>
                    <Box as="td" py={2} pr={3} color="gray.200" minW="180px">
                      {organization.address || '—'}
                    </Box>
                    <Box as="td" py={2} pr={3} color="gray.200" minW="180px">
                      {organization.external_url ? (
                        <a href={organization.external_url} target="_blank" rel="noopener noreferrer">
                          {organization.external_url}
                        </a>
                      ) : '—'}
                    </Box>
                    <Box as="td" py={2} pr={3} color="gray.200" minW="160px">
                      {organization.picture_org ? (
                        <a href={organization.picture_org} target="_blank" rel="noopener noreferrer">
                          Открыть
                        </a>
                      ) : '—'}
                    </Box>
                    <Box as="td" py={2} pr={3}>
                      <Flex gap={2}>
                        <Button size="xs" bg="#4C6BE6" color="white" onClick={() => startEdit(organization)}>
                          Редактировать
                        </Button>
                        <Button size="xs" bg="#C84E4E" color="white" onClick={() => handleDelete(organization.id)}>
                          Удалить
                        </Button>
                      </Flex>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </VStack>
  );
};

export default AdminOrganizationsPage;
