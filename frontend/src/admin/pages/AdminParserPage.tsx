import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  Input,
  Spinner,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
  backfillParserCategories,
  deleteParsedEvent,
  distributeParser,
  fetchEventCategories,
  fetchParsedEvents,
  fetchParserSources,
  resolveParsedEvent,
  runParser,
  updateParsedEventStatus,
} from '../services/adminApi';
import { useAdminAuth } from '../app/AdminAuthContext';
import type { AdminCategory, AdminParsedEvent, AdminParsedEventListResponse } from '../types/models';

type ResolveTarget = 'event' | 'news' | 'rejected';
type ManualStatus = 'new' | 'rejected' | 'error';

interface ParsedRowActionState {
  targetType: ResolveTarget;
  manualStatus: ManualStatus;
  groupIds: number[];
  errorText: string;
}

const AdminParserPage: React.FC = () => {
  const { session } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [activeItemId, setActiveItemId] = useState<number | null>(null);

  const [sources, setSources] = useState<unknown[]>([]);
  const [parsedPreview, setParsedPreview] = useState<AdminParsedEventListResponse | null>(null);
  const [unknownParsed, setUnknownParsed] = useState<AdminParsedEvent[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [rowState, setRowState] = useState<Record<number, ParsedRowActionState>>({});

  const [runSourceKeys, setRunSourceKeys] = useState('');
  const [runIncludeReserve, setRunIncludeReserve] = useState(false);
  const [runMaxEvents, setRunMaxEvents] = useState('100');

  const [distributeLimit, setDistributeLimit] = useState('200');
  const [distributeSourceKey, setDistributeSourceKey] = useState('');
  const [backfillLimit, setBackfillLimit] = useState('1000');

  const [resultText, setResultText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (err: any, fallback: string): string => {
    const detail = err?.response?.data?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join('; ');
    }
    if (typeof err?.message === 'string' && err.message.trim()) {
      return err.message;
    }
    return fallback;
  };

  const getDefaultRowState = (): ParsedRowActionState => ({
    targetType: 'event',
    manualStatus: 'new',
    groupIds: [],
    errorText: '',
  });

  const getRowState = (itemId: number): ParsedRowActionState => rowState[itemId] || getDefaultRowState();

  const updateRowState = (itemId: number, patch: Partial<ParsedRowActionState>) => {
    setRowState((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || getDefaultRowState()),
        ...patch,
      },
    }));
  };

  const loadMeta = async () => {
    setSourcesLoading(true);
    setError(null);
    try {
      const [sourcesData, parsedData, unknownParsedData, categoriesData] = await Promise.all([
        fetchParserSources(session),
        fetchParsedEvents({ limit: 10, offset: 0 }, session),
        fetchParsedEvents(
          {
            limit: 30,
            offset: 0,
            target_type: 'unknown',
            process_status: 'new',
          },
          session
        ),
        fetchEventCategories(session),
      ]);
      setSources(sourcesData);
      setParsedPreview(parsedData);
      setUnknownParsed(unknownParsedData.items);
      setCategories(categoriesData);
      setRowState((prev) => {
        const nextState = { ...prev };
        for (const item of unknownParsedData.items) {
          if (!nextState[item.id]) {
            nextState[item.id] = getDefaultRowState();
          }
        }
        return nextState;
      });
    } catch (err: any) {
      setError(getErrorMessage(err, 'Не удалось загрузить данные парсера'));
    } finally {
      setSourcesLoading(false);
    }
  };

  useEffect(() => {
    loadMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAction = async (
    action: () => Promise<unknown>,
    options?: {
      itemId?: number | null;
      successMessage?: string;
    }
  ) => {
    setLoading(true);
    setActiveItemId(options?.itemId ?? null);
    setError(null);
    try {
      const result = await action();
      const prefix = options?.successMessage ? `${options.successMessage}\n\n` : '';
      setResultText(`${prefix}${JSON.stringify(result, null, 2)}`);
      await loadMeta();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Операция завершилась ошибкой'));
    } finally {
      setLoading(false);
      setActiveItemId(null);
    }
  };

  const toggleCategoryForItem = (itemId: number, categoryId: number) => {
    const current = getRowState(itemId).groupIds;
    const next = current.includes(categoryId)
      ? current.filter((value) => value !== categoryId)
      : [...current, categoryId];
    updateRowState(itemId, { groupIds: next });
  };

  const handleResolveItem = async (item: AdminParsedEvent) => {
    const state = getRowState(item.id);
    if (state.targetType === 'event' && state.groupIds.length === 0) {
      setError('Для переноса в events выбери хотя бы одну категорию.');
      return;
    }
    await runAction(
      () =>
        resolveParsedEvent(
          item.id,
          {
            target_type: state.targetType,
            group_ids: state.targetType === 'event' ? state.groupIds : [],
            error_text: state.errorText.trim() || undefined,
          },
          session
        ),
      {
        itemId: item.id,
        successMessage: `parsed_event #${item.id} обработан через resolve.`,
      }
    );
  };

  const handleStatusUpdate = async (item: AdminParsedEvent) => {
    const state = getRowState(item.id);
    await runAction(
      () =>
        updateParsedEventStatus(
          item.id,
          {
            process_status: state.manualStatus,
            error_text: state.errorText.trim() || undefined,
          },
          session
        ),
      {
        itemId: item.id,
        successMessage: `Статус parsed_event #${item.id} обновлен.`,
      }
    );
  };

  const handleSkipAsRejected = async (item: AdminParsedEvent) => {
    const state = getRowState(item.id);
    await runAction(
      () =>
        updateParsedEventStatus(
          item.id,
          {
            process_status: 'rejected',
            error_text: state.errorText.trim() || 'Пропущено администратором после проверки дубля.',
          },
          session
        ),
      {
        itemId: item.id,
        successMessage: `parsed_event #${item.id} пропущен и переведен в rejected.`,
      }
    );
  };

  const handleDeleteParsedItem = async (item: AdminParsedEvent) => {
    await runAction(
      () => deleteParsedEvent(item.id, session),
      {
        itemId: item.id,
        successMessage: `parsed_event #${item.id} удален из staging.`,
      }
    );
  };

  return (
    <VStack align="stretch" gap={4}>
      {error ? (
        <Box bg="rgba(255,93,93,0.15)" border="1px solid rgba(255,93,93,0.45)" borderRadius="12px" p={3} color="#ffd1d1">
          {error}
        </Box>
      ) : null}

      <Grid templateColumns={{ base: '1fr', xl: '1fr 1fr' }} gap={4}>
        <Box bg="rgba(26, 31, 59, 0.9)" border="1px solid rgba(141, 158, 255, 0.24)" borderRadius="16px" p={4}>
          <Text color="white" fontSize="16px" fontWeight="700" mb={3}>
            Запуск парсинга (`/parser/run`)
          </Text>
          <VStack align="stretch" gap={3}>
            <Input
              value={runSourceKeys}
              onChange={(event) => setRunSourceKeys(event.target.value)}
              placeholder="source_keys через запятую (опционально)"
              bg="white"
              color="black"
            />
            <Input
              value={runMaxEvents}
              onChange={(event) => setRunMaxEvents(event.target.value)}
              type="number"
              placeholder="max_events_per_source"
              bg="white"
              color="black"
            />
            <Button
              variant={runIncludeReserve ? 'solid' : 'outline'}
              bg={runIncludeReserve ? '#4C6BE6' : 'transparent'}
              color={runIncludeReserve ? 'white' : 'gray.200'}
              borderColor="rgba(183, 197, 255, 0.35)"
              onClick={() => setRunIncludeReserve((prev) => !prev)}
            >
              include_reserve: {runIncludeReserve ? 'ON' : 'OFF'}
            </Button>
            <Button
              bg="#4C6BE6"
              color="white"
              loading={loading && activeItemId === null}
              onClick={() =>
                runAction(() =>
                  runParser(
                    {
                      source_keys: runSourceKeys
                        .split(',')
                        .map((value) => value.trim())
                        .filter(Boolean),
                      include_reserve: runIncludeReserve,
                      max_events_per_source: Number(runMaxEvents) || 100,
                    },
                    session
                  )
                )
              }
            >
              Запустить parser/run
            </Button>
          </VStack>
        </Box>

        <Box bg="rgba(26, 31, 59, 0.9)" border="1px solid rgba(141, 158, 255, 0.24)" borderRadius="16px" p={4}>
          <Text color="white" fontSize="16px" fontWeight="700" mb={3}>
            Перенос и backfill
          </Text>
          <VStack align="stretch" gap={3}>
            <Input
              value={distributeLimit}
              onChange={(event) => setDistributeLimit(event.target.value)}
              type="number"
              placeholder="limit для /parser/distribute"
              bg="white"
              color="black"
            />
            <Input
              value={distributeSourceKey}
              onChange={(event) => setDistributeSourceKey(event.target.value)}
              placeholder="source_key (опционально)"
              bg="white"
              color="black"
            />
            <Button
              bg="#4C6BE6"
              color="white"
              loading={loading && activeItemId === null}
              onClick={() =>
                runAction(() =>
                  distributeParser(
                    {
                      limit: Number(distributeLimit) || 200,
                      source_key: distributeSourceKey.trim() || undefined,
                    },
                    session
                  )
                )
              }
            >
              Запустить parser/distribute
            </Button>

            <Input
              value={backfillLimit}
              onChange={(event) => setBackfillLimit(event.target.value)}
              type="number"
              placeholder="limit для /parser/categories/backfill"
              bg="white"
              color="black"
            />
            <Button
              bg="#4C6BE6"
              color="white"
              loading={loading && activeItemId === null}
              onClick={() =>
                runAction(() =>
                  backfillParserCategories(
                    {
                      limit: Number(backfillLimit) || 1000,
                    },
                    session
                  )
                )
              }
            >
              Запустить categories/backfill
            </Button>
          </VStack>
        </Box>
      </Grid>

      <Grid templateColumns={{ base: '1fr', xl: '1fr 1fr' }} gap={4}>
        <Box bg="rgba(26, 31, 59, 0.9)" border="1px solid rgba(141, 158, 255, 0.24)" borderRadius="16px" p={4}>
          <Flex justify="space-between" align="center" mb={2}>
            <Text color="white" fontSize="16px" fontWeight="700">
              Источники парсера
            </Text>
            <Button size="sm" onClick={loadMeta} loading={sourcesLoading} bg="#3F4E8C" color="white">
              Обновить
            </Button>
          </Flex>
          {sourcesLoading ? (
            <Flex justify="center" py={8}>
              <Spinner color="#AFC7FF" />
            </Flex>
          ) : (
            <Textarea
              readOnly
              value={JSON.stringify(sources, null, 2)}
              minH="260px"
              bg="#0E1226"
              color="#CDE1FF"
              fontFamily="mono"
              fontSize="12px"
            />
          )}
        </Box>

        <Box bg="rgba(26, 31, 59, 0.9)" border="1px solid rgba(141, 158, 255, 0.24)" borderRadius="16px" p={4}>
          <Text color="white" fontSize="16px" fontWeight="700" mb={2}>
            Результат операции / превью parsed_event
          </Text>
          <Textarea
            readOnly
            value={resultText || JSON.stringify(parsedPreview, null, 2)}
            minH="260px"
            bg="#0E1226"
            color="#CDE1FF"
            fontFamily="mono"
            fontSize="12px"
          />
        </Box>
      </Grid>

      <Box bg="rgba(26, 31, 59, 0.9)" border="1px solid rgba(141, 158, 255, 0.24)" borderRadius="16px" p={4}>
        <Flex justify="space-between" align="center" mb={3}>
          <Text color="white" fontSize="16px" fontWeight="700">
            Ручной разбор unknown ({unknownParsed.length})
          </Text>
          <Button
            size="sm"
            onClick={loadMeta}
            loading={sourcesLoading}
            bg="#3F4E8C"
            color="white"
          >
            Обновить очередь
          </Button>
        </Flex>

        {unknownParsed.length === 0 ? (
          <Text color="#CDE1FF">Нет новых записей со статусом unknown/new.</Text>
        ) : (
          <VStack align="stretch" gap={3}>
            {unknownParsed.map((item) => {
              const state = getRowState(item.id);
              const isBusy = loading && activeItemId === item.id;
              return (
                <Box
                  key={item.id}
                  bg="#101834"
                  border="1px solid rgba(141, 158, 255, 0.24)"
                  borderRadius="12px"
                  p={3}
                >
                  <Flex justify="space-between" align={{ base: 'start', lg: 'center' }} gap={2} wrap="wrap">
                    <VStack align="start" gap={0}>
                      <Text color="white" fontWeight="700">
                        #{item.id} — {item.name}
                      </Text>
                      <Text color="#AFC7FF" fontSize="12px">
                        Источник: {item.source_name} ({item.source_key})
                      </Text>
                    </VStack>
                    <HStack>
                      <Badge colorScheme="purple">{item.target_type || 'unknown'}</Badge>
                      <Badge colorScheme={item.process_status === 'error' ? 'red' : 'blue'}>
                        {item.process_status || 'new'}
                      </Badge>
                    </HStack>
                  </Flex>

                  <Text color="#D6E5FF" fontSize="13px" mt={2}>
                    Дата: {item.date_event || '—'} | Старт: {item.start_time || '—'} | Цена: {item.price || '—'}
                  </Text>
                  <Text color="#D6E5FF" fontSize="13px">
                    Адрес: {item.address || '—'}
                  </Text>
                  {item.external_url ? (
                    <Text color="#8FB0FF" fontSize="12px" mt={1}>
                      {item.external_url}
                    </Text>
                  ) : null}

                  <Box my={3} borderTop="1px solid rgba(141, 158, 255, 0.24)" />

                  <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }} gap={3}>
                    <VStack align="stretch" gap={2}>
                      <Text color="white" fontSize="13px">
                        Resolve target
                      </Text>
                      <select
                        value={state.targetType}
                        onChange={(event) =>
                          updateRowState(item.id, { targetType: event.target.value as ResolveTarget })
                        }
                        style={{
                          background: 'white',
                          color: 'black',
                          borderRadius: '6px',
                          height: '40px',
                          padding: '0 8px',
                        }}
                      >
                        <option value="event">event</option>
                        <option value="news">news</option>
                        <option value="rejected">rejected</option>
                      </select>

                      {state.targetType === 'event' ? (
                        <Box
                          border="1px solid rgba(141, 158, 255, 0.24)"
                          borderRadius="8px"
                          p={2}
                          maxH="140px"
                          overflowY="auto"
                        >
                          <VStack align="stretch" gap={1}>
                            {categories.map((category) => (
                              <label key={category.id} style={{ color: 'white', fontSize: '13px' }}>
                                <input
                                  type="checkbox"
                                  checked={state.groupIds.includes(category.id)}
                                  onChange={() => toggleCategoryForItem(item.id, category.id)}
                                  style={{ marginRight: '8px' }}
                                />
                                {category.name}
                              </label>
                            ))}
                          </VStack>
                        </Box>
                      ) : null}
                    </VStack>

                    <VStack align="stretch" gap={2}>
                      <Text color="white" fontSize="13px">
                        Manual status
                      </Text>
                      <select
                        value={state.manualStatus}
                        onChange={(event) =>
                          updateRowState(item.id, { manualStatus: event.target.value as ManualStatus })
                        }
                        style={{
                          background: 'white',
                          color: 'black',
                          borderRadius: '6px',
                          height: '40px',
                          padding: '0 8px',
                        }}
                      >
                        <option value="new">new</option>
                        <option value="rejected">rejected</option>
                        <option value="error">error</option>
                      </select>
                      <Textarea
                        value={state.errorText}
                        onChange={(event) => updateRowState(item.id, { errorText: event.target.value })}
                        placeholder="Комментарий / error_text (опционально)"
                        bg="white"
                        color="black"
                        minH="84px"
                      />
                    </VStack>
                  </Grid>

                  <HStack mt={3} gap={2} flexWrap="wrap">
                    <Button
                      bg="#4C6BE6"
                      color="white"
                      loading={isBusy}
                      onClick={() => handleResolveItem(item)}
                    >
                      Resolve (перенос)
                    </Button>
                    <Button
                      variant="outline"
                      borderColor="rgba(183, 197, 255, 0.35)"
                      color="gray.100"
                      loading={isBusy}
                      onClick={() => handleStatusUpdate(item)}
                    >
                      Обновить status
                    </Button>
                    <Button
                      variant="outline"
                      borderColor="rgba(242, 181, 79, 0.65)"
                      color="#ffd898"
                      loading={isBusy}
                      onClick={() => handleSkipAsRejected(item)}
                    >
                      Пропустить в rejected
                    </Button>
                    <Button
                      variant="outline"
                      borderColor="rgba(255, 93, 93, 0.55)"
                      color="#ffd1d1"
                      loading={isBusy}
                      onClick={() => handleDeleteParsedItem(item)}
                    >
                      Удалить запись
                    </Button>
                  </HStack>
                </Box>
              );
            })}
          </VStack>
        )}
      </Box>
    </VStack>
  );
};

export default AdminParserPage;
