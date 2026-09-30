import axios from 'axios'

// 서버 주소는 이 인스턴스 한 곳에만 적는다.
const api = axios.create({ baseURL: 'http://localhost:8080' })

// 정상 응답 템플릿 { httpStatus, message, result } 에서 result 만 꺼낸다.
// 컴포넌트는 템플릿 모양을 몰라도 된다.
export async function getResult(url, config) {
  const res = await api.get(url, config)
  return res.data.result
}

export async function postResult(url, body) {
  const res = await api.post(url, body)
  return res.data.result
}

export async function putResult(url, body) {
  const res = await api.put(url, body)
  return res.data.result
}

// 삭제 응답 본문의 httpStatus 는 204 지만 실제 HTTP 상태는 200 이고, 본문에 result 가 온다.
export async function deleteResult(url) {
  const res = await api.delete(url)
  return res.data.result
}

// 오류 응답 템플릿 { code, description, detail } 은 정상 응답과 모양이 다르다.
// 화면에 보여 줄 한 줄을 만든다. 취소된 요청은 null 이다.
export function toMessage(err) {
  if (axios.isCancel(err)) return null

  const data = err.response?.data
  if (data?.description) return data.description
  if (err.response) return `요청이 실패했습니다 (${err.response.status})`
  return '서버에 연결하지 못했습니다. 8080 포트가 떠 있는지 확인해 주세요.'
}
