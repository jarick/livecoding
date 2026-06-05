import { type ReactNode } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";

interface Props {
  left: ReactNode;
  middle: ReactNode;
  right: ReactNode;
}

export default function ResizableLayout({ left, middle, right }: Props) {
  return (
    <Group className="sp-layout">
      <Panel defaultSize="15%" minSize="8%" maxSize="30%">
        {left}
      </Panel>
      <Separator className="sp-resize-handle" />
      <Panel defaultSize="55%" minSize="20%">
        {middle}
      </Panel>
      <Separator className="sp-resize-handle" />
      <Panel defaultSize="30%" minSize="15%" maxSize="50%">
        {right}
      </Panel>
    </Group>
  );
}
