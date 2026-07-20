package com.traintrack.repository;

import com.traintrack.model.WeightEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface WeightEntryRepository extends JpaRepository<WeightEntry, Long> {

    List<WeightEntry> findByAthleteIdOrderByEntryDateDesc(String athleteId);

    List<WeightEntry> findByAthleteIdAndEntryDateBetweenOrderByEntryDate(
            String athleteId, LocalDate from, LocalDate to);

    Optional<WeightEntry> findByAthleteIdAndEntryDate(String athleteId, LocalDate date);

    Optional<WeightEntry> findFirstByAthleteIdOrderByEntryDateDesc(String athleteId);

    Optional<WeightEntry> findFirstByAthleteIdOrderByEntryDateAsc(String athleteId);
}
