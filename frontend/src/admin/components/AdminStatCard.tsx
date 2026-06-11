import { Box, Flex, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import type { IconType } from 'react-icons';

interface Props {
  title: string;
  value: string;
  hint?: string;
  icon: IconType;
  delay?: number;
}

const MotionBox = motion(Box);

const AdminStatCard: React.FC<Props> = ({ title, value, hint, icon: Icon, delay = 0 }) => (
  <MotionBox
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, delay }}
    bg="rgba(31, 36, 64, 0.88)"
    border="1px solid rgba(117, 135, 255, 0.35)"
    borderRadius="18px"
    p={5}
    boxShadow="0 10px 34px rgba(17, 25, 76, 0.3)"
  >
    <Flex justify="space-between" align="start">
      <Box>
        <Text color="gray.300" fontSize="13px" mb={2}>
          {title}
        </Text>
        <Text color="white" fontSize="32px" fontWeight="700" lineHeight="1">
          {value}
        </Text>
        {hint ? (
          <Text color="gray.400" fontSize="12px" mt={3}>
            {hint}
          </Text>
        ) : null}
      </Box>
      <Box
        bg="rgba(114, 150, 204, 0.25)"
        borderRadius="12px"
        p={2.5}
        color="#AFC7FF"
      >
        <Icon size={20} />
      </Box>
    </Flex>
  </MotionBox>
);

export default AdminStatCard;
