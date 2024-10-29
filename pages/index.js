import dynamic from 'next/dynamic';

const DynamicPaymentComponent = dynamic(() => import('../components/form'), {
  ssr: false,
});

export default function Page() {
  return (
    <div>
      <DynamicPaymentComponent />
    </div>
  );
}

