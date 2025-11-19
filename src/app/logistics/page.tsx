'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogisticsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/logistics/planner');
  }, [router]);

  return null;
}
