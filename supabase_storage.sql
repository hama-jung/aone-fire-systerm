-- 1. 스토리지 버킷 생성 (상가 이미지, 시장 지도)
insert into storage.buckets (id, name, public) 
values ('store-images', 'store-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('market-maps', 'market-maps', true)
on conflict (id) do nothing;

-- 2. RLS(Row Level Security) 정책 설정
-- 현재 앱은 Supabase Auth(로그인 세션) 없이 DB/스토리지를 이용하므로,
-- public(익명) 역할에 대해 insert/select/update/delete 권한을 부여해야 합니다.

-- [store-images] 정책
create policy "Public Select store-images"
on storage.objects for select
using ( bucket_id = 'store-images' );

create policy "Public Insert store-images"
on storage.objects for insert
with check ( bucket_id = 'store-images' );

create policy "Public Update store-images"
on storage.objects for update
using ( bucket_id = 'store-images' );

create policy "Public Delete store-images"
on storage.objects for delete
using ( bucket_id = 'store-images' );

-- [market-maps] 정책
create policy "Public Select market-maps"
on storage.objects for select
using ( bucket_id = 'market-maps' );

create policy "Public Insert market-maps"
on storage.objects for insert
with check ( bucket_id = 'market-maps' );

create policy "Public Update market-maps"
on storage.objects for update
using ( bucket_id = 'market-maps' );

create policy "Public Delete market-maps"
on storage.objects for delete
using ( bucket_id = 'market-maps' );