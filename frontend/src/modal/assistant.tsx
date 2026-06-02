import { Box, Button, Flex, Text, Input,Image } from '@chakra-ui/react';
import Modal from 'react-modal';
import { useRef, useEffect, useState } from 'react';
import assistant from '../pictures/assistant2.png';
import background from '../pictures/background2.png';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

type Message = {
    id: number;
    type: 'assistant' | 'user';
    text: string;
};

const AiAssistantModal = ({ isOpen, onClose }: Props) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            type: 'assistant',
            text: 'Привет. Я твой ИИ помощник. Могу рассказать о мероприятиях, которые сейчас проходят в городе, найти интересное событие и ответить на вопросы. Чем могу помочь?',
        },
        {
            id: 2,
            type: 'user',
            text: 'Какие концерты пройдут на этих выходных?',
        },
    ]);

    const [value, setValue] = useState('');

    const chatRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
        if (!chatRef.current) return;

        chatRef.current.scrollTop = chatRef.current.scrollHeight;
    };

    const handleSend = () => {
        if (!value.trim()) return;

        setMessages(prev => [
            ...prev,
            {
                id: Date.now(),
                type: 'user',
                text: value,
            },
        ]);

        setValue('');
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            style={{
                overlay: {
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    zIndex: 1000,
                },
                content: {
                    inset: '50% auto auto 50%',
                    transform: 'translate(-50%, -50%)',
                    padding: 0,
                    border: 'none',
                    borderRadius: '36px',
                    maxWidth: '760px',
                    width: '90%',
                    background: '#1D1B2E',
                    overflow: 'hidden',
                },
            }}
        >

            <Box p={6} fontFamily="Unbounded">
                {/* HEADER */}
                <Flex align="center" gap={4} mb={6}>
                    <Image
                    src={assistant}
                    alt="assistant"
                    maxW={{ base: '120px', md: '180px', lg: '70px' }}
                    pointerEvents="none"
                    userSelect="none"
                    />

                    <Box color="white" >
                        <Text className="assistant-title" fontSize="25px">
                            ИИ ассистент
                        </Text>

                        <Text className="assistant-subtitle">
                            Твой помощник по мероприятиям в городе
                        </Text>
                    </Box>
                </Flex>

                {/* CHAT */}
                <Box
                    bgImage={`url(${background})`}
                    borderRadius="24px"
                    overflow="hidden"
                    bgSize="cover"
                    backgroundPosition="center"
                    p={4}
                    mb={1}
                    w="700px"
                    h="500px"
                    ml="6px"
                    display="flex"
                    flexDirection="column"
                >
               
                    <Flex
                        ref={chatRef}
                        direction="column"
                        flex="1"
                        overflowY="auto"
                    >
                    {messages.map(message => (
                        <Flex
                            key={message.id}
                            justify={message.type === 'user' ? 'flex-end' : 'flex-start'}
                            mb={4}
                            fontSize="15px"
                        >
                            <Box
                                maxW="55%"
                                px={5}
                                py={4}
                                borderRadius="16px"
                                bg={message.type === 'user' ? '#0C0066' : 'rgb(255, 255, 255)'}
                                color={message.type === 'user' ? 'white' : 'black'}
                            >
                                {message.text}
                            </Box>
                        </Flex>
                    ))}
                    </Flex>

                    {/* INPUT */}
                    <Flex gap={3}
                        align="center">
                        <Input
                            value={value}
                            bg="#FFFFFF"
                            borderRadius="10px"
                            onChange={e => setValue(e.target.value)}
                            placeholder="Сообщение..."
                            className="message-input"
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    handleSend();
                                }
                            }}
                        />

                        <Button
                            className="send-button"
                            onClick={handleSend}
                            bg="#0C0066"
                            borderRadius="10px"
                        >
                            Отправить
                        </Button>
                    </Flex>
                    
                </Box>
                
            </Box>
        </Modal>
    );
};

export default AiAssistantModal;