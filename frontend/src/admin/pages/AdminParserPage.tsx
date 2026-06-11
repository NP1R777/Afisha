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
import { useEffect, useState } from 'react';
import {
  backfillParserCategories,
  distributeParser,
  fetchParsedEvents,
  fetchParserSources,
  runParser,
} from '../services/adminApi';
import { useAdminAuth } from '../app/AdminAuthContext';

const AdminParserPage: React.FC = () => {
  const { session } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [sourcesLoading, setSourcesLoading] = useState(false);

  const [sources, setSources] = useState<unknown[]>([]);
  const [parsedPreview, setParsedPreview] = useState<unknown>(null);

  const [runSourceKeys, setRunSourceKeys] = useState('');
  const [runIncludeReserve, setRunIncludeReserve] = useState(false);
  const [runMaxEvents, setRunMaxEvents] = useState('100');

  const [distributeLimit, setDistributeLimit] = useState('200');
  const [distributeSourceKey, setDistributeSourceKey] = useState('');
  const [backfillLimit, setBackfillLimit] = useState('1000');

  const [resultText, setResultText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadMeta = async () => {
    setSourcesLoading(true);
    setError(null);
    try {
      const [sourcesData, parsedData] = await Promise.all([
        fetchParserSources(session),
        fetchParsedEvents({ limit: 10, offset: 0 }, session),
      ]);
      setSources(sourcesData);
      setParsedPreview(parsedData);
    } catch (err: any) {
      setError(err?.message || 'Не удалось загрузить данные парсера');
    } finally {
      setSourcesLoading(false);
    }
  };

  useEffect(() => {
    loadMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAction = async (action: () => Promise<unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await action();
      setResultText(JSON.stringify(result, null, 2));
      await loadMeta();
    } catch (err: any) {
      setError(err?.message || 'Операция завершилась ошибкой');
    } finally {
      setLoading(false);
    }
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
              loading={loading}
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
              loading={loading}
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
              loading={loading}
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
    </VStack>
  );
};

export default AdminParserPage;
