package com.traintrack.repository;

import com.traintrack.model.PlannedWorkout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlannedWorkoutRepository extends JpaRepository<PlannedWorkout, Long> {

    List<PlannedWorkout> findByPlanIdOrderByWorkoutDate(Long planId);

    List<PlannedWorkout> findByPlanIdAndWorkoutDateBetweenOrderByWorkoutDate(
            Long planId, LocalDate from, LocalDate to);

    Optional<PlannedWorkout> findByPlanIdAndWorkoutDate(Long planId, LocalDate date);

    List<PlannedWorkout> findByPlanIdAndPlanWeek(Long planId, int planWeek);
}
