import { Box, type BoxProps, Text } from '@mantine/core'
import type { ReactNode } from 'react'
import classes from './CharacterSheet.module.scss'

type SectionCardProps = {
  title: string
  children: ReactNode
} & BoxProps

export function SectionCard({ title, children, className, ...boxProps }: SectionCardProps) {
  return (
    <Box
      className={`${classes.section} ${className ?? ''}`}
      {...boxProps}
    >
      <Box className={classes.sectionHeader} px="xs" py={6}>
        <Text size="xs" tt="uppercase" fw={700} c="dimmed">
          {title}
        </Text>
      </Box>
      <Box p="xs">{children}</Box>
    </Box>
  )
}
