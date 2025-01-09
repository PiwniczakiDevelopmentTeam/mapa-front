<template>
  <form @submit.prevent="submitForm" class="form-edit-school">
    <div class="row">
      <div class="col-md-4">
        <InputField
          label="Numer RSPO"
          id="numerRspo"
          type="number"
          v-model="localSchool.numerRspo"
        />
      </div>
      <div class="col-md-8">
        <InputField
          label="Nazwa"
          id="nazwa"
          placeholder="Wpisz nazwę szkoły"
          v-model="localSchool.nazwa"
        />
      </div>
    </div>

    <div class="row">
      <div class="col-md-6">
        <SelectField
          label="Typ szkoły"
          id="typ"
          :options="typeOptions"
          v-model="localSchool.typ"
        />
      </div>
      <div class="col-md-6">
        <InputField
          label="Status publiczno-prawny"
          id="statusPublicznoPrawny"
          placeholder="Np. publiczna, niepubliczna..."
          v-model="localSchool.statusPublicznoPrawny"
        />
      </div>
    </div>

    <fieldset>
      <legend>Adres</legend>
      <div class="row">
        <div class="col-md-4">
          <InputField
            label="Województwo"
            id="wojewodztwo"
            placeholder="Np. Lubelskie"
            v-model="localSchool.wojewodztwo"
          />
        </div>
        <div class="col-md-4">
          <InputField
            label="Powiat"
            id="powiat"
            placeholder="Np. parczewski"
            v-model="localSchool.powiat"
          />
        </div>
        <div class="col-md-4">
          <InputField
            label="Gmina"
            id="gmina"
            placeholder="Np. Parczew"
            v-model="localSchool.gmina"
          />
        </div>
      </div>
      <div class="row">
        <div class="col-md-4">
          <InputField
            label="Miejscowość"
            id="miejscowosc"
            v-model="localSchool.miejscowosc"
          />
        </div>
        <div class="col-md-4">
          <InputField
            label="Kod pocztowy"
            id="kodPocztowy"
            placeholder="00-000"
            v-model="localSchool.kodPocztowy"
          />
        </div>
        <div class="col-md-4">
          <InputField
            label="Ulica"
            id="ulica"
            v-model="localSchool.ulica"
          />
        </div>
      </div>
      <div class="row">
        <div class="col-md-4">
          <InputField
            label="Nr budynku"
            id="numerBudynku"
            v-model="localSchool.numerBudynku"
          />
        </div>
        <div class="col-md-4">
          <InputField
            label="Nr lokalu"
            id="numerLokalu"
            v-model="localSchool.numerLokalu"
          />
        </div>
      </div>
    </fieldset>

    <fieldset>
      <legend>Kontakt i Dyrektor</legend>
      <div class="row">
        <div class="col-md-6">
          <InputField
            label="Email"
            id="email"
            type="email"
            placeholder="np. szkola@onet.pl"
            v-model="localSchool.email"
          />
        </div>
        <div class="col-md-6">
          <InputField
            label="Telefon"
            id="telefon"
            placeholder="np. 555-123-456"
            v-model="localSchool.telefon"
          />
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <InputField
            label="Dyrektor - Imię"
            id="dyrektorImie"
            v-model="localSchool.dyrektorImie"
          />
        </div>
        <div class="col-md-6">
          <InputField
            label="Dyrektor - Nazwisko"
            id="dyrektorNazwisko"
            v-model="localSchool.dyrektorNazwisko"
          />
        </div>
      </div>
    </fieldset>

    <div class="d-flex justify-content-end mt-3">
      <button
        type="button"
        class="btn btn-secondary me-2"
        @click="cancelEdit"
      >
        Anuluj
      </button>
      <button type="submit" class="btn btn-primary">
        Zapisz
      </button>
    </div>
  </form>
</template>

<script>
import { ref, watch } from "vue";
import InputField from "../FormFields/InputField.vue";
import SelectField from "../FormFields/SelectField.vue";

export default {
  name: "SchoolEditForm",
  components: {
    InputField,
    SelectField,
  },
  props: {
    school: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props, { emit }) {
    const localSchool = ref({ ...props.school });

    // Jeśli props.school się zmieni, aktualizujemy localSchool
    watch(
      () => props.school,
      (newVal) => {
        localSchool.value = { ...newVal };
      },
      { deep: true }
    );

    const typeOptions = [
      { value: "", label: "Wybierz..." },
      { value: "Podstawowa", label: "Podstawowa" },
      { value: "Średnia", label: "Średnia" },
      { value: "Uniwersytet", label: "Uniwersytet" },
    ];

    function submitForm() {
      emit("save", localSchool.value);
    }

    function cancelEdit() {
      emit("cancel");
    }

    return {
      localSchool,
      typeOptions,
      submitForm,
      cancelEdit,
    };
  },
};
</script>

<style scoped>
.form-edit-school {
  font-size: 0.9rem;
}

legend {
  font-size: 1rem;
  font-weight: 500;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}
</style>
