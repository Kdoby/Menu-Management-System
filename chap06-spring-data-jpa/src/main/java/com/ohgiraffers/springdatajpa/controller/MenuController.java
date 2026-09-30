package com.ohgiraffers.springdatajpa.controller;

import com.ohgiraffers.springdatajpa.common.ResponseMessage;
import com.ohgiraffers.springdatajpa.dto.MenuDTO;
import com.ohgiraffers.springdatajpa.entity.Menu;
import com.ohgiraffers.springdatajpa.service.MenuService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/* 설명. 아래 어노테이션들이 곧 API 명세가 된다.
 *  @Tag          : 명세 화면에서 이 컨트롤러의 API들을 묶는 이름표
 *  @Operation    : API 하나가 무엇을 하는지 (summary는 목록에, description은 펼쳤을 때 보인다)
 *  @ApiResponses : 어떤 상태 코드가 언제 돌아오는지
 *  @Parameter    : 각 파라미터가 무엇인지
 *  ----------------------------------------------------------------------------------
 *  주의. 이 프로젝트의 정상 응답은 ResponseMessage 템플릿을 따르고,
 *       실제 데이터는 result(Map<String, Object>) 안에 들어 있다.
 *       Map 은 명세에서 그냥 '객체'로만 표현되므로 result 안에 무엇이 어떤 이름으로 담기는지는
 *       자동으로 드러나지 않는다. 그래서 아래 description 에 그것을 직접 적어 둔다.
 *       이 한 줄이 있고 없고에 따라, 명세를 읽고 화면을 만드는 쪽의 정확도가 갈린다.
 * */
@Tag(name = "메뉴", description = "메뉴 조회와 등록·수정·삭제를 제공한다.")
@RestController
@RequestMapping("/api/menus")
public class MenuController {

    private final MenuService menuService;

    // @Autowired를 작성하지 않아도 자동 적용됨을 잊지 말자.
    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    /* 목차. 1. 모든 메뉴 조회 */
    @Operation(
            summary = "전체 메뉴 조회",
            description = "등록된 모든 메뉴를 페이징 없이 조회한다. " +
                    "응답의 result.menus 에 MenuDTO 배열이 담긴다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ResponseMessage.class)))
    })
    @GetMapping
    public ResponseEntity<ResponseMessage> findAllMenus() {

        List<MenuDTO> menus = menuService.findAllMenus();

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("menus", menus);

        ResponseMessage responseMessage = new ResponseMessage(
                HttpStatus.OK.value(),
                "메뉴 목록 조회 성공",
                resultMap
        );

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(responseMessage);
    }

    /* 목차. 2. 페이징 처리된 메뉴 목록 조회 */

    /**
     * 주어진 Pageable 정보를 바탕으로 메뉴 리스트를 조회하고, 페이지네이션 정보를 포함한 응답을 반환한다.
     *
     * <p>{@link org.springframework.data.domain.Pageable} 객체를 인자로 받아 페이지 요청 정보를
     * 처리한다. @PageableDefault 어노테이션을 통해 기본 페이지 설정을 지정할 수 있다.</p>
     *
     * @param pageable {@link org.springframework.data.domain.Pageable} 객체로, 페이지 번호, 크기, 정렬 정보를 관리한다.
     * @return 페이징 처리된 메뉴 목록과 페이지 정보를 포함한 ResponseEntity 객체
     */
    @Operation(
            summary = "메뉴 목록 조회 (페이징)",
            description = "페이지 단위로 메뉴를 조회한다. " +
                    "요청 파라미터는 page 와 size 이고, **page 는 1부터 센다.** " +
                    "응답의 result 에 content(MenuDTO 배열), totalElements, totalPages, size, " +
                    "number(현재 페이지, 1부터), first, last 가 담긴다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ResponseMessage.class)))
    })
    @GetMapping("/pages")
    public ResponseEntity<ResponseMessage> findMenuPage(@PageableDefault Pageable pageable) {

        System.out.println("pageable = " + pageable);

        Page<MenuDTO> menuPage = menuService.findMenuList(pageable);

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("content", menuPage.getContent());              // 현재 페이지의 데이터
        resultMap.put("totalElements", menuPage.getTotalElements());  // 전체 데이터 수
        resultMap.put("totalPages", menuPage.getTotalPages());        // 전체 페이지 수
        resultMap.put("size", menuPage.getSize());                    // 페이지 크기
        /* 설명. one-indexed-parameters 설정은 '요청'의 page 파라미터에만 적용된다.
         *  Page.getNumber()는 여전히 0부터 시작하므로, 요청과 응답의 기준을 맞추기 위해 +1 해서 내려준다.
         * */
        resultMap.put("number", menuPage.getNumber() + 1);            // 현재 페이지 번호(1부터 시작)
        resultMap.put("first", menuPage.isFirst());                   // 첫 페이지 여부
        resultMap.put("last", menuPage.isLast());                     // 마지막 페이지 여부

        ResponseMessage responseMessage = new ResponseMessage(
                HttpStatus.OK.value(),
                "페이징 처리된 메뉴 목록 조회 성공",
                resultMap
        );

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(responseMessage);
    }

    /* 목차. 3. 정렬 기능이 추가된 페이징 처리 메뉴 목록 조회 */

    /**
     * 사용자가 지정한 페이지, 크기, 정렬 기준, 정렬 방향에 따라 메뉴 목록을 조회한다.
     *
     * <p>클라이언트에서 전달한 파라미터로 페이징 및 정렬을 적용하여 메뉴 목록을 조회하고,
     * 결과를 반환한다. 정렬 기준과 방향을 동적으로 지정할 수 있다.</p>
     *
     * <p>페이지 번호와 크기는 위 findMenuPage()와 동일하게 Pageable로 받는다.
     * 그래야 one-indexed-parameters 설정이 두 엔드포인트에 똑같이 적용되어
     * 같은 page 값이 항상 같은 페이지를 가리키게 된다.
     * (page와 size를 int로 직접 받으면 이 설정이 적용되지 않아 두 API의 기준이 어긋난다)</p>
     *
     * @param pageable  페이지 번호와 크기를 담은 Pageable 객체 (기본 크기: 5)
     * @param sortBy    정렬 기준 필드 (기본값: menuPrice)
     * @param direction 정렬 방향 (asc 또는 desc, 기본값: asc)
     * @return 페이징 및 정렬이 적용된 메뉴 목록과 페이지 정보를 포함한 ResponseEntity 객체
     */
    @Operation(
            summary = "메뉴 목록 조회 (페이징 + 정렬)",
            description = "정렬 기준을 지정해 페이지 단위로 메뉴를 조회한다. " +
                    "page 는 1부터 세고, 기본 페이지 크기는 5다. " +
                    "응답의 result 는 위 페이징 조회와 같고, sort 와 direction 이 더 담긴다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ResponseMessage.class)))
    })
    @Parameter(name = "sortBy", description = "정렬 기준 필드 (menuCode, menuName, menuPrice 등)")
    @Parameter(name = "direction", description = "정렬 방향. asc 또는 desc")
    @GetMapping("/pages/sort")
    public ResponseEntity<ResponseMessage> findMenuPageWithSort(
            @PageableDefault(size = 5) Pageable pageable,
            @RequestParam(defaultValue = "menuPrice") String sortBy,
            @RequestParam(defaultValue = "asc") String direction
    ) {
        // 정렬 방향 설정
        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction) ?
                Sort.Direction.DESC : Sort.Direction.ASC;

        // 정렬 객체 생성
        Sort sort = Sort.by(sortDirection, sortBy);

        // 페이징 처리된 메뉴 조회
        Page<MenuDTO> menuPage = menuService.findMenuListWithSort(pageable, sort);

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("content", menuPage.getContent());              // 현재 페이지의 데이터
        resultMap.put("totalElements", menuPage.getTotalElements());  // 전체 데이터 수
        resultMap.put("totalPages", menuPage.getTotalPages());        // 전체 페이지 수
        resultMap.put("size", menuPage.getSize());                    // 페이지 크기
        /* 설명. one-indexed-parameters 설정은 '요청'의 page 파라미터에만 적용된다.
         *  Page.getNumber()는 여전히 0부터 시작하므로, 요청과 응답의 기준을 맞추기 위해 +1 해서 내려준다.
         * */
        resultMap.put("number", menuPage.getNumber() + 1);            // 현재 페이지 번호(1부터 시작)
        resultMap.put("first", menuPage.isFirst());                   // 첫 페이지 여부
        resultMap.put("last", menuPage.isLast());                     // 마지막 페이지 여부
        resultMap.put("sort", sortBy);                                // 정렬 기준 필드
        resultMap.put("direction", direction);                        // 정렬 방향

        ResponseMessage responseMessage = new ResponseMessage(
                HttpStatus.OK.value(),
                "페이징 처리 및 정렬이 적용된 메뉴 목록 조회 성공",
                resultMap
        );

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(responseMessage);
    }

    /* 목차. 4. 메뉴 코드로 단일 메뉴 조회 */

    /**
     * 메뉴 코드에 해당하는 단일 메뉴를 조회한다.
     *
     * <p>경로 변수로 전달된 메뉴 코드를 사용하여 메뉴를 조회하고, 결과를 반환한다.</p>
     *
     * @param menuCode 조회할 메뉴의 코드 (PK)
     * @return 조회된 메뉴 정보를 포함한 ResponseEntity 객체
     */
    @Operation(
            summary = "메뉴 상세 조회",
            description = "메뉴 코드로 메뉴 한 건을 조회한다. " +
                    "응답의 result.menu 에 MenuDTO 가 담긴다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ResponseMessage.class))),
            @ApiResponse(responseCode = "404", description = "해당 코드의 메뉴가 없음",
                    content = @Content(schema = @Schema(hidden = true)))
    })
    @Parameter(name = "menuCode", description = "조회할 메뉴의 코드(PK)", required = true)
    @GetMapping("/{menuCode}")
    public ResponseEntity<ResponseMessage> findMenuByCode(@PathVariable int menuCode) {

        MenuDTO menu = menuService.findMenuByCode(menuCode);

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("menu", menu);

        ResponseMessage responseMessage = new ResponseMessage(
                HttpStatus.OK.value(),
                "메뉴 상세 조회 성공",
                resultMap
        );

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(responseMessage);
    }

    /* 목차. 5. 가격 기준 메뉴 검색 */

    /**
     * 지정된 가격을 초과하는 메뉴 목록을 조회한다.
     *
     * <p>쿼리 파라미터로 전달된 가격보다 높은 가격의 메뉴 목록을 조회하고, 결과를 반환한다.</p>
     *
     * @param menuPrice 기준 가격
     * @return 기준 가격을 초과하는 메뉴 목록을 포함한 ResponseEntity 객체
     */
    @Operation(
            summary = "가격으로 메뉴 검색",
            description = "지정한 가격을 **초과하는**(미만이 아니다) 메뉴를 조회한다. " +
                    "응답의 result.menus 에 MenuDTO 배열이, result.searchPrice 에 기준 가격이 담긴다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ResponseMessage.class)))
    })
    @Parameter(name = "menuPrice", description = "기준 가격. 이 값을 초과하는 메뉴만 조회된다", required = true)
    @GetMapping("/search")
    public ResponseEntity<ResponseMessage> findMenusByPrice(@RequestParam Integer menuPrice) {

        List<MenuDTO> menus = menuService.findMenusByPrice(menuPrice);

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("menus", menus);
        resultMap.put("searchPrice", menuPrice);

        ResponseMessage responseMessage = new ResponseMessage(
                HttpStatus.OK.value(),
                menuPrice + "원 초과 메뉴 목록 조회 성공",
                resultMap
        );

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(responseMessage);
    }

    /* 추가 구현. 메뉴 목록 조건별 필터링 검색 */
    @Operation(
            summary = "조건별 필터링 메뉴 조회(페이징 + 정렬)",
            description = "키워드, 카테고리, 가격, 상태별 필터링 조회를 하나의 API로 통합한다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ResponseMessage.class)))
    })
    @GetMapping("/pages/search")
    public ResponseEntity<ResponseMessage> findMenusByFilter(
            @PageableDefault(size = 12) Pageable pageable,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer categoryCode,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(required = false) String orderableStatus,
            @RequestParam(defaultValue = "menuCode") String sortBy,
            @RequestParam(defaultValue = "asc") String direction
    ) {

        // 정렬 방향 설정
        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction) ?
                Sort.Direction.DESC : Sort.Direction.ASC;

        // 정렬 객체 생성
        Sort sort = Sort.by(sortDirection, sortBy);

        Page<MenuDTO> menuPage =  menuService.findMenusByFilter(
                keyword, categoryCode, minPrice, maxPrice, orderableStatus,
                pageable, sort
        );

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("content", menuPage.getContent());              // 현재 페이지의 데이터
        resultMap.put("totalElements", menuPage.getTotalElements());  // 전체 데이터 수
        resultMap.put("totalPages", menuPage.getTotalPages());        // 전체 페이지 수
        resultMap.put("size", menuPage.getSize());                    // 페이지 크기
        /* 설명. one-indexed-parameters 설정은 '요청'의 page 파라미터에만 적용된다.
         *  Page.getNumber()는 여전히 0부터 시작하므로, 요청과 응답의 기준을 맞추기 위해 +1 해서 내려준다.
         * */
        resultMap.put("number", menuPage.getNumber() + 1);            // 현재 페이지 번호(1부터 시작)
        resultMap.put("first", menuPage.isFirst());                   // 첫 페이지 여부
        resultMap.put("last", menuPage.isLast());                     // 마지막 페이지 여부
        resultMap.put("sort", sortBy);                                // 정렬 기준 필드
        resultMap.put("direction", direction);                        // 정렬 방향

        ResponseMessage responseMessage = new ResponseMessage(
                HttpStatus.OK.value(),
                "조건별 필터링 메뉴 목록 조회 성공",
                resultMap
        );

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(responseMessage);
    }

    /* 목차. 6. 새 메뉴 등록 */

    /**
     * 새로운 메뉴를 등록한다.
     *
     * <p>요청 본문으로 전달된 메뉴 정보를 사용하여 새 메뉴를 등록하고, 등록된 메뉴 정보를 반환한다.</p>
     *
     * @param menuDTO 등록할 메뉴 정보
     * @return 등록된 메뉴 정보를 포함한 ResponseEntity 객체
     */
    @Operation(
            summary = "메뉴 등록",
            description = "새 메뉴를 등록한다. " +
                    "요청 본문에는 menuName, menuPrice, categoryCode, orderableStatus 를 담는다. " +
                    "menuCode 는 서버가 채우므로 보내지 않는다. " +
                    "orderableStatus 는 'Y' 또는 'N' 한 글자다. " +
                    "응답의 result.menu 에 등록된 MenuDTO 가 담긴다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "등록 성공",
                    content = @Content(schema = @Schema(implementation = ResponseMessage.class))),
            @ApiResponse(responseCode = "400", description = "요청 본문이 올바르지 않음",
                    content = @Content(schema = @Schema(hidden = true)))
    })
    @PostMapping
    public ResponseEntity<ResponseMessage> saveMenu(@RequestBody MenuDTO menuDTO) {

        MenuDTO savedMenu = menuService.saveMenu(menuDTO);

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("menu", savedMenu);

        ResponseMessage responseMessage = new ResponseMessage(
                HttpStatus.CREATED.value(),
                "메뉴 등록 성공",
                resultMap
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(responseMessage);
    }

    /* 목차. 7. 메뉴 수정 */

    /**
     * 지정된 메뉴 코드의 메뉴 정보를 수정한다.
     *
     * <p>경로 변수로 전달된 메뉴 코드와 요청 본문으로 전달된 메뉴 정보를 사용하여
     * 기존 메뉴를 수정하고, 수정된 메뉴 정보를 반환한다.</p>
     *
     * @param menuCode 수정할 메뉴의 코드 (PK)
     * @param menuDTO  수정할 메뉴 정보
     * @return 수정된 메뉴 정보를 포함한 ResponseEntity 객체
     */
    @Operation(
            summary = "메뉴 수정",
            description = "메뉴 코드에 해당하는 메뉴를 수정한다. " +
                    "요청 본문은 등록과 같은 모양이고, 바꾸지 않을 값도 함께 보낸다. " +
                    "응답의 result.menu 에 수정된 MenuDTO 가 담긴다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "수정 성공",
                    content = @Content(schema = @Schema(implementation = ResponseMessage.class))),
            @ApiResponse(responseCode = "404", description = "해당 코드의 메뉴가 없음",
                    content = @Content(schema = @Schema(hidden = true)))
    })
    @Parameter(name = "menuCode", description = "수정할 메뉴의 코드(PK)", required = true)
    @PutMapping("/{menuCode}")
    public ResponseEntity<ResponseMessage> updateMenu(
            @PathVariable int menuCode,
            @RequestBody MenuDTO menuDTO
    ) {

        MenuDTO updatedMenu = menuService.updateMenu(menuCode, menuDTO);

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("menu", updatedMenu);

        ResponseMessage responseMessage = new ResponseMessage(
                HttpStatus.OK.value(),
                "메뉴 수정 성공",
                resultMap
        );

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(responseMessage);
    }

    /* 목차. 8. 메뉴 삭제 */

    /**
     * 지정된 메뉴 코드의 메뉴를 삭제한다.
     *
     * <p>경로 변수로 전달된 메뉴 코드에 해당하는 메뉴를 삭제하고, 삭제 결과를 반환한다.</p>
     *
     * @param menuCode 삭제할 메뉴의 코드 (PK)
     * @return 삭제된 메뉴 코드를 포함한 ResponseEntity 객체
     */
    @Operation(
            summary = "메뉴 삭제",
            description = "메뉴 코드에 해당하는 메뉴를 삭제한다. " +
                    "**응답 상태는 200 이다.** 템플릿 안의 httpStatus 에는 204 가 적혀 있지만, " +
                    "204 는 본문을 가질 수 없어 실제 응답은 200 으로 내려간다. " +
                    "응답의 result.deletedMenuCode 에 삭제된 코드가 담긴다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "삭제 성공",
                    content = @Content(schema = @Schema(implementation = ResponseMessage.class))),
            @ApiResponse(responseCode = "404", description = "해당 코드의 메뉴가 없음",
                    content = @Content(schema = @Schema(hidden = true)))
    })
    @Parameter(name = "menuCode", description = "삭제할 메뉴의 코드(PK)", required = true)
    @DeleteMapping("/{menuCode}")
    public ResponseEntity<ResponseMessage> deleteMenu(@PathVariable int menuCode) {

        menuService.deleteMenu(menuCode);

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("deletedMenuCode", menuCode);

        ResponseMessage responseMessage = new ResponseMessage(
                HttpStatus.NO_CONTENT.value(),
                "메뉴 삭제 성공",
                resultMap
        );

        return ResponseEntity
                // 실제 NO_CONTENT(204)는 응답 바디를 포함하지 않으므로 OK(200)로 변경
                .status(HttpStatus.OK)
                .body(responseMessage);
    }
}
