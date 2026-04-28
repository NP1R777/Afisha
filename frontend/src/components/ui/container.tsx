import { Box, BoxProps } from '@chakra-ui/react';

export const ContainerFluid = ({ children, ...props }: BoxProps) => {
  return (
    <Box
      maxW={1536}
      w="100%"
      mx="auto"
      px={{
        lg: 12,
        base: 4,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};
