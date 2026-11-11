"use client";
import { BookImage, Heart } from "lucide-react";
import { useState } from "react";
import { Button, Chip, Dialog, EmptyState, IconButton, Progress, Segmented, Select, Sheet, Switch, TextField, useToast } from "@/components/ui";

// Design system check: every primitive in isolation. Not linked from the app.
export default function DesignPage() {
  const toast = useToast();
  const [on, setOn] = useState(true);
  const [seg, setSeg] = useState("a");
  const [dialog, setDialog] = useState(false);
  const [sheet, setSheet] = useState(false);
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold">Primitives</h1>
      <div className="flex flex-wrap gap-2">
        <Button>Filled</Button><Button variant="tonal">Tonal</Button><Button variant="text">Text</Button><Button variant="danger">Danger</Button><Button disabled>Disabled</Button><Button loading>Loading</Button>
        <IconButton label="Favourite"><Heart size={20} /></IconButton><IconButton label="Favourite, active" active><Heart size={20} /></IconButton>
      </div>
      <div className="rounded-lg bg-surface"><Switch label="A switch" description="With a supporting line." checked={on} onChange={setOn} /></div>
      <Segmented label="Segmented" value={seg} onChange={setSeg} options={[{ value: "a", label: "First" }, { value: "b", label: "Second" }, { value: "c", label: "Third" }]} />
      <TextField label="Text field" placeholder="Type here" />
      <TextField label="Text field with an error" defaultValue="Oops" error="This value is not allowed." />
      <Select label="Select" value="One" onChange={() => {}} options={["One", "Two"]} />
      <div className="flex gap-2"><Chip>Chip</Chip><Chip selected onClick={() => {}}>Selected chip</Chip></div>
      <Progress value={0.4} label="Determinate" /><Progress value={null} label="Indeterminate" />
      <div className="flex flex-wrap gap-2">
        <Button variant="tonal" onClick={() => setDialog(true)}>Open dialog</Button>
        <Button variant="tonal" onClick={() => setSheet(true)}>Open sheet</Button>
        <Button variant="tonal" onClick={() => toast("A short message.")}>Toast</Button>
        <Button variant="tonal" onClick={() => toast("Something went wrong.", "error")}>Error toast</Button>
      </div>
      <EmptyState icon={<BookImage size={56} />} title="Empty state" body="One line on what goes here and how to add it." action={<Button>Do the thing</Button>} />
      <Dialog open={dialog} onClose={() => setDialog(false)} title="Dialog" actions={<Button onClick={() => setDialog(false)}>Done</Button>}><p className="text-sm text-muted">Escape or a click outside closes it.</p></Dialog>
      <Sheet open={sheet} onClose={() => setSheet(false)} title="Sheet"><p className="px-4 text-sm text-muted">Bottom sheet on phones, side panel on wide screens.</p></Sheet>
    </div>
  );
}
