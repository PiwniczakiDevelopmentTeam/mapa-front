<template>
  <form @submit.prevent="submitForm" class="form-edit-school">
    <fieldset class="mb-4">
      <legend>Dane podstawowe</legend>
      <div class="row">
        <div class="col-md-4 mb-3">
          <InputField
            label="Numer RSPO"
            type="number"
            :enableComparison="true"
            v-model="localBefore.numerRspo"
            :rspoValue="schoolAfter.numerRspo"
          />
        </div>
        <div class="col-md-4 mb-3">
          <InputField
            label="Nazwa"
            :enableComparison="true"
            v-model="localBefore.nazwa"
            :rspoValue="schoolAfter.nazwa"
          />
        </div>
      </div>
      <div class="row">
        <div class="col-md-4 mb-3">
          <SelectField
            label="Typ szkoły"
            :options="typeOptions"
            :enableComparison="true"
            v-model="localBefore.typ"
            :rspoValue="schoolAfter.typ"
          />
        </div>
        <div class="col-md-4 mb-3">
          <InputField
            label="Status publiczno-prawny"
            :enableComparison="true"
            v-model="localBefore.statusPublicznoPrawny"
            :rspoValue="schoolAfter.statusPublicznoPrawny"
          />
        </div>
        <div class="col-md-4 mb-3">
          <InputField
            label="Kategoria uczniów"
            :enableComparison="true"
            v-model="localBefore.kategoriaUczniow"
            :rspoValue="schoolAfter.kategoriaUczniow"
          />
        </div>
      </div>
    </fieldset>

    <fieldset class="mb-4">
      <legend>Adres</legend>
      <div class="row">
        <div class="col-md-4 mb-3">
          <InputField
            label="Województwo"
            :enableComparison="true"
            v-model="localBefore.wojewodztwo"
            :rspoValue="schoolAfter.wojewodztwo"
          />
        </div>
        <div class="col-md-4 mb-3">
          <InputField
            label="Powiat"
            :enableComparison="true"
            v-model="localBefore.powiat"
            :rspoValue="schoolAfter.powiat"
          />
        </div>
        <div class="col-md-4 mb-3">
          <InputField
            label="Gmina"
            :enableComparison="true"
            v-model="localBefore.gmina"
            :rspoValue="schoolAfter.gmina"
          />
        </div>
      </div>
      <div class="row">
        <div class="col-md-4 mb-3">
          <InputField
            label="Rodzaj gminy"
            :enableComparison="true"
            v-model="localBefore.gminaRodzaj"
            :rspoValue="schoolAfter.gminaRodzaj"
          />
        </div>
        <div class="col-md-4 mb-3">
          <InputField
            label="Miejscowość"
            :enableComparison="true"
            v-model="localBefore.miejscowosc"
            :rspoValue="schoolAfter.miejscowosc"
          />
        </div>
        <div class="col-md-4 mb-3">
          <InputField
            label="Kod pocztowy"
            :enableComparison="true"
            v-model="localBefore.kodPocztowy"
            :rspoValue="schoolAfter.kodPocztowy"
          />
        </div>
      </div>
      <div class="row">
        <div class="col-md-4 mb-3">
          <InputField
            label="Ulica"
            :enableComparison="true"
            v-model="localBefore.ulica"
            :rspoValue="schoolAfter.ulica"
          />
        </div>
        <div class="col-md-4 mb-3">
          <InputField
            label="Nr budynku"
            :enableComparison="true"
            v-model="localBefore.numerBudynku"
            :rspoValue="schoolAfter.numerBudynku"
          />
        </div>
        <div class="col-md-4 mb-3">
          <InputField
            label="Nr lokalu"
            :enableComparison="true"
            v-model="localBefore.numerLokalu"
            :rspoValue="schoolAfter.numerLokalu"
          />
        </div>
      </div>
    </fieldset>

    <fieldset class="mb-4">
      <legend>Kontakt i Dyrektor</legend>
      <div class="row">
        <div class="col-md-6 mb-3">
          <InputField
            label="Email"
            type="email"
            :enableComparison="true"
            v-model="localBefore.email"
            :rspoValue="schoolAfter.email"
          />
        </div>
        <div class="col-md-6 mb-3">
          <InputField
            label="Telefon"
            :enableComparison="true"
            v-model="localBefore.telefon"
            :rspoValue="schoolAfter.telefon"
          />
        </div>
      </div>
      <div class="row">
        <div class="col-md-6 mb-3">
          <InputField
            label="Strona Internetowa"
            :enableComparison="true"
            v-model="localBefore.stronaInternetowa"
            :rspoValue="schoolAfter.stronaInternetowa"
          />
        </div>
        <div class="col-md-3 mb-3">
          <InputField
            label="Dyrektor - Imię"
            :enableComparison="true"
            v-model="localBefore.dyrektorImie"
            :rspoValue="schoolAfter.dyrektorImie"
          />
        </div>
        <div class="col-md-3 mb-3">
          <InputField
            label="Dyrektor - Nazwisko"
            :enableComparison="true"
            v-model="localBefore.dyrektorNazwisko"
            :rspoValue="schoolAfter.dyrektorNazwisko"
          />
        </div>
      </div>
    </fieldset>

    <fieldset class="mb-4">
      <legend>Dane prawno-organizacyjne</legend>
      <div class="row">
        <div class="col-md-4 mb-3">
          <InputField
            label="Liczba uczniów"
            type="number"
            :enableComparison="true"
            v-model="localBefore.liczbaUczniow"
            :rspoValue="schoolAfter.liczbaUczniow"
          />
        </div>

        <div class="col-md-4 mb-3">
          <InputField
            label="Podmiot prowadzący - Nazwa"
            :enableComparison="true"
            v-model="localBefore.podmiotProwadzacy[0].nazwa"
            :rspoValue="schoolAfter.podmiotProwadzacy?.[0]?.nazwa"
            placeholder="Np. 'GMINA OLSZTYN'"
          />
        </div>

        <div class="col-md-4 mb-3">
          <InputField
            label="Podmiot prowadzący - Typ"
            :enableComparison="true"
            v-model="localBefore.podmiotProwadzacy[0].typ.nazwa"
            :rspoValue="schoolAfter.podmiotProwadzacy?.[0]?.typ?.nazwa"
            placeholder="Np. 'Miasto na prawach powiatu'"
          />
        </div>
      </div>
    </fieldset>

    <fieldset class="mb-4">
      <legend>Daty</legend>
      <div class="row">
        <div class="col-md-3 mb-3">
          <InputField
            label="Data rozpoczęcia"
            :enableComparison="true"
            v-model="localBefore.dataRozpoczecia"
            :rspoValue="schoolAfter.dataRozpoczecia"
          />
        </div>
        <div class="col-md-3 mb-3">
          <InputField
            label="Data założenia"
            :enableComparison="true"
            v-model="localBefore.dataZalozenia"
            :rspoValue="schoolAfter.dataZalozenia"
          />
        </div>
        <div class="col-md-3 mb-3">
          <InputField
            label="Data zakończenia"
            :enableComparison="true"
            v-model="localBefore.dataZakonczenia"
            :rspoValue="schoolAfter.dataZakonczenia"
          />
        </div>
        <div class="col-md-3 mb-3">
          <InputField
            label="Data likwidacji"
            :enableComparison="true"
            v-model="localBefore.dataLikwidacji"
            :rspoValue="schoolAfter.dataLikwidacji"
          />
        </div>
      </div>
    </fieldset>

    <fieldset class="mb-4">
      <legend>Współrzędne geograficzne</legend>
      <div class="row">
        <div class="col-md-6 mb-3">
          <InputField
            label="Szerokość geograficzna"
            type="text"
            :enableComparison="true"
            v-model="localBefore.geography.y"
            :rspoValue="schoolAfter.geography.y"
          />
        </div>
        <div class="col-md-6 mb-3">
          <InputField
            label="Długość geograficzna"
            type="text"
            :enableComparison="true"
            v-model="localBefore.geography.x"
            :rspoValue="schoolAfter.geography.x"
          />
        </div>
      </div>
    </fieldset>

    <div class="d-flex justify-content-end mt-4">
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
import InputField from "@/components/FormFields/InputField.vue";
import SelectField from "@/components/FormFields/SelectField.vue";

export default {
  name: "SchoolEditForm",
  components: {
    InputField,
    SelectField
  },
  props: {
    schoolBefore: {
      type: Object,
      default: () => ({})
    },
    schoolAfter: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ["save", "cancel"],

  setup(props, { emit }) {
    const localBefore = ref({});

    function initLocalBefore() {
      const clone = JSON.parse(JSON.stringify(props.schoolBefore));

      if (!clone.geography) {
        clone.geography = { x: 0, y: 0 };
      }

      if (typeof clone.podmiotProwadzacy === 'string') {
        try {
          clone.podmiotProwadzacy = JSON.parse(clone.podmiotProwadzacy);
        } catch(e) {
          console.warn('Nie udało się sparsować "podmiotProwadzacy" z JSON:', e);
          clone.podmiotProwadzacy = [];
        }
      }

      if (!Array.isArray(clone.podmiotProwadzacy) || clone.podmiotProwadzacy.length === 0) {
        clone.podmiotProwadzacy = [
          {
            id: null,
            typ: {
              id: null,
              nazwa: ''
            },
            nazwa: ''
          }
        ];
      } else {
        if (!clone.podmiotProwadzacy[0].typ) {
          clone.podmiotProwadzacy[0].typ = { id: null, nazwa: '' };
        }
      }

      localBefore.value = clone;
    }

    watch(
      () => props.schoolBefore,
      () => initLocalBefore(),
      { deep: true, immediate: true }
    );

    const typeOptions = [
      { value: "", label: "Wybierz..." },
      { value: "Podstawowa", label: "Podstawowa" },
      { value: "Średnia", label: "Średnia" },
      { value: "Uniwersytet", label: "Uniwersytet" },
    ];

    function submitForm() {
      emit("save", localBefore.value);
    }
    function cancelEdit() {
      emit("cancel");
    }

    return {
      localBefore,
      typeOptions,
      submitForm,
      cancelEdit,
      props
    };
  }
};
</script>

<style scoped>
.form-edit-school {
  font-size: 0.9rem;
}
</style>
