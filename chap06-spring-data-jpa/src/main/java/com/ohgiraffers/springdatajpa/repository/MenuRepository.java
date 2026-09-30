package com.ohgiraffers.springdatajpa.repository;

import com.ohgiraffers.springdatajpa.entity.Menu;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuRepository extends JpaRepository<Menu, Integer>, JpaSpecificationExecutor<Menu> {

    /* 전달 받은 가격을 초과하는 메뉴의 목록을 조회하는 메소드 */
    List<Menu> findByMenuPriceGreaterThan(Integer menuPrice);

    /* 전달 받은 가격을 초과하는 메뉴의 목록을 가격 순으로 조회하는 메소드 */
    List<Menu> findByMenuPriceGreaterThanOrderByMenuPrice(Integer menuPrice);

    /* 전달 받은 가격을 초과하는 메뉴의 목록을 전달 받는 정렬 기준으로 조회하는 메소드 */
    List<Menu> findByMenuPriceGreaterThan(Integer menuPrice, Sort sort);

    /* 전달 받은 파라미터로 필터링 된 메뉴의 목록을 조회하는 메소드 */
    @Query("SELECT m FROM Menu m " +
            "WHERE (:keyword IS NULL OR m.menuName LIKE CONCAT('%', :keyword, '%')) " +
            "AND (:categoryCode IS NULL OR m.category.categoryCode = :categoryCode) " +
            "AND (:minPrice IS NULL OR m.menuPrice >= :minPrice) " +
            "AND (:maxPrice IS NULL OR m.menuPrice <= :maxPrice) " +
            "AND (:orderableStatus IS NULL OR m.orderableStatus = :orderableStatus)")
    Page<Menu> search(@Param("keyword") String keyword,
                      @Param("categoryCode") Integer categoryCode,
                      @Param("minPrice") Integer minPrice,
                      @Param("maxPrice") Integer maxPrice,
                      @Param("orderableStatus") String orderableStatus,
                      Pageable pageable);
}