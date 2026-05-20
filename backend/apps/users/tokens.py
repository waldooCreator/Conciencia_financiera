"""
Custom JWT serializers for Finanzas Personales.
Returns user data along with access and refresh tokens.
"""
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from apps.users.serializers import UserSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that includes user data in the response.
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        user_data = UserSerializer(self.user).data
        
        data.update({
            'user': user_data,
            'message': 'Login successful'
        })
        
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    JWT login view that returns user data along with tokens.
    """
    serializer_class = CustomTokenObtainPairSerializer
