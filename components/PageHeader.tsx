export default function PageHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-[18px] flex items-end justify-between">
      <h1 className="display text-[46px] leading-[0.82] tracking-[0.01em] uppercase">
        {title}
      </h1>
      {right ?? <span className="mb-2 h-[5px] w-[52px] rounded-sm bg-accent" />}
    </div>
  );
}
