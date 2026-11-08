import Link from 'next/link';
import { Compass } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <EmptyState
      icon={Compass}
      title="페이지를 찾을 수 없어요"
      description="주소가 바뀌었거나 삭제된 페이지예요."
      action={
        <Button asChild>
          <Link href="/">홈으로 가기</Link>
        </Button>
      }
      className="my-12"
    />
  );
}
