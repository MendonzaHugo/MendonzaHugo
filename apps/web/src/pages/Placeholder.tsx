export function PlaceholderPage({ title, fase }: { title: string; fase: number }) {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">Esta visão chega na fase {fase} do roteiro.</p>
    </div>
  );
}
