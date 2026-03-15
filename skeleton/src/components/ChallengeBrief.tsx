import { useMemo, memo } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  content: string
}

const plugins = [remarkGfm]

function ChallengeBrief({ content }: Props) {
  const memoizedPlugins = useMemo(() => plugins, [])

  return (
    <div className="prose overflow-y-auto h-full px-4 py-4">
      <Markdown remarkPlugins={memoizedPlugins}>{content}</Markdown>
    </div>
  )
}

export default memo(ChallengeBrief)
