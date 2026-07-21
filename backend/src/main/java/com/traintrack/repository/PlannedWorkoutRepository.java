package com.traintrack.repository;

import com.traintrack.model.PlannedWorkout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlannedWorkoutRepository extends JpaRepository<PlannedWorkout, Long> {

    // NOTE: PlannedWorkout has a "plan" association plus a convenience
    // getPlanId() method (returns plan.getId() without loading the full
    // entity). That convenience getter makes Spring Data's query-derivation
    // treat "PlanId" as a single flat property instead of the "plan.id"
    // association path, which fails at query-creation time with
    // "Could not resolve attribute 'planId'". Use the explicit Plan_Id
    // underscore notation to force traversal through the association.
    // See: https://docs.spring.io/spring-data/jpa/reference/repositories/query-methods-details.html#repositories.query-methods.query-property-expressions

    List<PlannedWorkout> findByPlan_IdOrderByWorkoutDate(Long planId);

    List<PlannedWorkout> findByPlan_IdAndWorkoutDateBetweenOrderByWorkoutDate(
            Long planId, LocalDate from, LocalDate to);

    Optional<PlannedWorkout> findByPlan_IdAndWorkoutDate(Long planId, LocalDate date);

    List<PlannedWorkout> findByPlan_IdAndPlanWeek(Long planId, int planWeek);
}
