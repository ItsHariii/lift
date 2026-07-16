export default function PageHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <h1 className="text-4xl font-black tracking-tighter">{title}</h1>
      {right}
    </div>
  );
}
