'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ERPPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/erp/products');
  }, [router]);

  return null;
}
