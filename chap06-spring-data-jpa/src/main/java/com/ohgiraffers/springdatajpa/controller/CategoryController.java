package com.ohgiraffers.springdatajpa.controller;

import com.ohgiraffers.springdatajpa.common.ResponseMessage;
import com.ohgiraffers.springdatajpa.dto.CategoryDTO;
import com.ohgiraffers.springdatajpa.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Tag(name = "카테고리", description = "메뉴가 속한 카테고리를 조회한다.")
@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    // @Autowired를 작성하지 않아도 자동 적용됨을 잊지 말자.
    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @Operation(
            summary = "전체 카테고리 조회",
            description = "모든 카테고리를 조회한다. 메뉴 등록·수정 폼의 선택 목록과 목록 화면의 필터에 쓴다. " +
                    "응답의 result.categories 에 CategoryDTO 배열이 담긴다. " +
                    "카테고리는 상위-하위 두 단계다. refCategoryCode 와 refCategoryName 이 상위 카테고리를 가리키고, " +
                    "최상위 카테고리(식사·음료·디저트)는 둘 다 null 이다. " +
                    "메뉴가 실제로 속하는 것은 하위 카테고리다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ResponseMessage.class)))
    })
    @GetMapping
    public ResponseEntity<ResponseMessage> findAllCategories() {
        List<CategoryDTO> categories = categoryService.findAllCategories();
        
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("categories", categories);
        
        ResponseMessage responseMessage = new ResponseMessage(
                HttpStatus.OK.value(),
                "카테고리 목록 조회 성공",
                resultMap
        );
        
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(responseMessage);
    }

    @Operation(
            summary = "카테고리 상세 조회",
            description = "카테고리 코드로 카테고리 한 건을 조회한다. " +
                    "응답의 result.category 에 CategoryDTO 가 담긴다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ResponseMessage.class))),
            @ApiResponse(responseCode = "404", description = "해당 코드의 카테고리가 없음",
                    content = @Content(schema = @Schema(hidden = true)))
    })
    @Parameter(name = "categoryCode", description = "조회할 카테고리의 코드(PK)", required = true)
    @GetMapping("/{categoryCode}")
    public ResponseEntity<ResponseMessage> findCategoryByCode(@PathVariable int categoryCode) {
        CategoryDTO category = categoryService.findCategoryByCode(categoryCode);
        
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("category", category);
        
        ResponseMessage responseMessage = new ResponseMessage(
                HttpStatus.OK.value(),
                "카테고리 상세 조회 성공",
                resultMap
        );
        
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(responseMessage);
    }
} 