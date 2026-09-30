package com.ohgiraffers.springdatajpa.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

/* 설명. API 명세(OpenAPI) 문서의 표지에 해당하는 설정이다.
 *  1. 어노테이션이 곧 문서다
 *    - springdoc은 컨트롤러에 붙은 어노테이션을 읽어 명세를 자동으로 만든다.
 *    - 이 클래스에는 코드가 한 줄도 없다. 문서의 제목과 설명을 적어 두는 자리이기 때문이다.
 *  2. 결과물이 두 가지다
 *    - http://localhost:8080/swagger-ui.html : 사람이 보는 화면. 여기서 API를 직접 호출해 볼 수 있다.
 *    - http://localhost:8080/v3/api-docs     : 기계가 읽는 JSON. 프론트엔드를 만들 때 이것을 쓴다.
 *  3. 왜 프론트엔드에 필요한가
 *    - AI 에이전트에게 "이 서버가 무엇을 줄 수 있는지"를 알려 주는 유일한 수단이다.
 *    - 명세가 없으면 에이전트는 엔드포인트를 기억이나 짐작으로 쓰게 되고, 그때부터 틀리기 시작한다.
 * */
@OpenAPIDefinition(
        info = @Info(
                title = "메뉴 관리 API 명세서",
                description = "Spring Data JPA 수업용 프로젝트(chap06)의 API 명세서다. " +
                        "메뉴와 카테고리 조회, 메뉴 등록·수정·삭제를 제공한다.",
                version = "v1",
                contact = @Contact(
                        name = "Ohgiraffers 강사팀",
                        email = "owl.ohgiraffers@gmail.com"
                )
        )
)
@Configuration
public class SwaggerConfig {

    /* 설명. @EnableWebMvc 를 붙이지 않는다.
     *  이 어노테이션은 Spring MVC의 자동 설정을 꺼 버린다.
     *  그러면 같은 패키지의 CorsConfig가 적용되지 않아 React 앱(5173)의 요청이 다시 막히고,
     *  Swagger UI 화면의 정적 자원도 함께 깨진다.
     * */
}
